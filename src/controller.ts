import { BaseController } from 'lynx-framework/base.controller';
import { EntityMetadata, AdminType, FieldParameters } from './decorators';
import BaseEntity from 'lynx-framework/entities/base.entity';
import MediaEntity from 'lynx-framework/entities/media.entity';
import Request from 'lynx-framework/request';
import EditableEntity from './editable-entity';
import { generateSchema } from './generator';
import { Like, FindOperator, getConnection, Repository } from 'typeorm';
import * as moment from 'moment';
import Datagrid from 'lynx-datagrid/datagrid';
import AdminUIModule from '.';

let _adminUI: { entity: any; meta: EntityMetadata }[];
let hasInit = false;

export class Controller extends BaseController {
    static async saveEntity(entity: any, req: Request): Promise<any> {
        if ((entity as EditableEntity).onBeforeSave) {
            await entity.onBeforeSave(req);
        }
        let updated = await entity.save();
        if ((updated as EditableEntity).onAfterSave) {
            await updated.onAfterSave(req);
        }
        return updated;
    }

    async postConstructor() {
        await super.postConstructor();
        if (!hasInit) {
            hasInit = true;
            _adminUI = generateSchema(this.app.config.db.entities);
        }
    }

    get adminUI(): { entity: any; meta: EntityMetadata }[] {
        return _adminUI;
    }

    entitiesList(): { name: string; readableName: string }[] {
        let list = [];
        for (let d of this.adminUI) {
            list.push({
                name: d.entity.name,
                readableName: d.meta.name,
            });
        }
        return list;
    }

    async retrieveEntity(
        entityName: string,
        id: any
    ): Promise<BaseEntity | null> {
        for (let d of this.adminUI) {
            if (d.entity.name == entityName) {
                if (!id || id == '0') {
                    return new d.entity();
                }
                return await d.entity.findOne(id, {
                    relations: d.meta.classParameters.relations,
                });
            }
        }
        return null;
    }

    retrieveEntityClass(entityName: string): any {
        for (let d of this.adminUI) {
            if (d.entity.name == entityName) {
                return d.entity;
            }
        }
        return null;
    }

    retrieveMetadata(entityName: string): EntityMetadata {
        for (let d of this.adminUI) {
            if (d.entity.name == entityName) {
                return d.meta;
            }
        }
        return null as any;
    }

    async retrieveData(
        req: Request,
        entityName: string,
        id: any
    ): Promise<any> {
        let current = await this.retrieveEntity(entityName, id);
        if (!current) {
            if (!id || id == 0) {
                return new (this.retrieveEntityClass(entityName))();
            }
            return null;
        }
        return await this.cleanData(
            req,
            current,
            this.retrieveMetadata(entityName)
        );
    }

    async retrieveList(
        req: Request,
        entityName: string,
        datagrid: Datagrid<any>
    ): Promise<void> {
        let Class = this.retrieveEntityClass(entityName);
        if (!Class) {
            return null as any;
        }
        let metadata = this.retrieveMetadata(entityName);
        let filterWhere = null as any;
        if (metadata.classParameters.filterBy) {
            filterWhere = await metadata.classParameters.filterBy(req);
        }
        let where = {} as any;
        let smartWhere = {} as any;
        for (let key in metadata.fields) {
            let f = metadata.fields[key];
            if (!f.searchable && !f.smartSearchable) {
                continue;
            }
            let v = null;
            if (f.searchable) {
                v = datagrid.getQueryValue(key);
            } else if (f.smartSearchable) {
                v = datagrid.getQueryValue('smartSearch');
            }
            if (v) {
                let right;
                let left = '';
                if (f.type == AdminType.String) {
                    right = Like('%' + (v as string).toLowerCase() + '%');
                    key = 'e.' + key;
                } else {
                    let Class = this.retrieveEntityClass(f.selfType as string);
                    if (Class) {
                        if (
                            (metadata.classParameters.relations || []).indexOf(
                                key
                            ) == -1
                        ) {
                            this.logger.error(
                                'Searching for the column `' +
                                    key +
                                    '` is enabled only if `' +
                                    key +
                                    '` is specified in the `relations` parmeter of `AdminUI`'
                            );
                            throw new Error(
                                'The `relation` field of AdminUI not include ' +
                                    key
                            );
                        }
                        right = v;
                        key = key.toUpperCase();
                        left = '.id';
                    } else {
                        right = v;
                        key = 'e.' + key;
                    }
                }
                if (f.smartSearchable) {
                    smartWhere[key + left] = right;
                } else {
                    where[key + left] = right;
                }
            }
        }

        let repository = getConnection().getRepository(
            Class
        ) as Repository<any>;

        let ors = [];
        if (Object.keys(smartWhere).length > 0) {
            for (let key in smartWhere) {
                let tmp = { ...filterWhere, ...where } as any;
                tmp[key] = smartWhere[key];
                ors.push(tmp);
            }
        } else {
            for (let key in where) {
                let tmp = { ...filterWhere } as any;
                tmp[key] = where[key];
                ors.push(tmp);
            }
        }

        where = ors;

        let qb = repository.createQueryBuilder('e');
        for (let relation of metadata.classParameters.relations || []) {
            qb = qb.leftJoinAndSelect('e.' + relation, relation.toUpperCase());
        }

        for (let orOption of where) {
            let parts = [];
            let params: any = {};
            let counter = 0;
            for (let key in orOption) {
                let _q = '';
                let value = orOption[key];
                if (value instanceof Array) {
                    _q += '(';
                    for (let i = 0; i < value.length; i++) {
                        let _v = 'param' + counter;
                        params[_v] = value[i];
                        counter++;
                        _q += key + ' = :' + _v;
                        if (i < value.length - 1) {
                            _q += ' OR';
                        }
                        _q += ' ';
                    }
                    _q += ') ';
                } else if (value instanceof FindOperator) {
                    let _v = 'param' + counter;
                    params[_v] = value.value;
                    counter++;
                    _q += key + ' LIKE :' + _v + ' ';
                } else {
                    let _v = 'param' + counter;
                    params[_v] = value;
                    counter++;
                    _q += key + ' = :' + _v + ' ';
                }
                parts.push(_q.trim());
            }
            let q = parts.join(' AND ');
            qb = qb.orWhere(q, params);
        }

        await datagrid.fetchData((params) => {
            let order = params.order;
            if (
                Object.keys(order).length == 0 &&
                metadata.classParameters.defaultOrderBy
            ) {
                let tmp = metadata.classParameters.defaultOrderBy as string;
                if (tmp.startsWith('-')) {
                    order[tmp.substring(1)] = 'ASC';
                } else if (tmp.startsWith('+')) {
                    order[tmp.substring(1)] = 'DESC';
                } else {
                    order[tmp] = 'DESC';
                }
            }
            for (let key in order) {
                qb = qb.addOrderBy('e.' + key, order[key]);
            }
            qb = qb.skip(params.skip);
            qb = qb.take(params.take);
            return qb.getManyAndCount();
        });
        let tmp = datagrid.data as BaseEntity[];
        let promises: Promise<void>[] = [];
        tmp.forEach((t) => promises.push(t.reload()));
        await Promise.all(promises);
        for (let i = 0; i < datagrid.data.length; i++) {
            datagrid.data[i] = await this.cleanData(
                req,
                datagrid.data[i],
                metadata,
                true
            );
        }
    }

    async cleanData(
        req: Request,
        _data: BaseEntity,
        metadata: EntityMetadata,
        forList?: boolean
    ) {
        let obj = {} as any;
        let data = _data as any;
        let defaultValues = {} as any;
        if (req.query.defaultValues) {
            defaultValues = JSON.parse(req.query.defaultValues as string);
        }
        for (let key in metadata.fields) {
            if (metadata.fields[key].query) {
                let executor = metadata.fields[key].query as any;
                let datagrid = new Datagrid(key + '-', req);
                await datagrid.fetchData((params) =>
                    executor(req, data, params)
                );
                let gridMetadata = this.retrieveMetadata(
                    metadata.fields[key].selfType as string
                );
                if (gridMetadata) {
                    for (let i = 0; i < datagrid.data.length; i++) {
                        datagrid.data[i] = await this.cleanData(
                            req,
                            datagrid.data[i] as BaseEntity,
                            gridMetadata,
                            true
                        );
                    }
                }
                obj[key] = datagrid;
                obj[key + '__disable_creation'] = false;
                if (metadata.fields[key].max) {
                    if (
                        datagrid.length >= (metadata.fields[key].max as number)
                    ) {
                        obj[key + '__disable_creation'] = true;
                    }
                }
            } else {
                obj[key] = data[key];
                if (obj[key] instanceof Object) {
                    if (obj[key] instanceof Promise) {
                        obj[key] = await obj[key];
                    }
                    if (obj[key] instanceof Date) {
                        obj[key] = moment(data[key]);
                    } else if (obj[key] instanceof Array) {
                        if (forList) {
                            obj[key] = obj[key].map((e: EditableEntity) =>
                                e.getLabel()
                            );
                        } else {
                            obj[key] = obj[key].map((e: EditableEntity) =>
                                e.getId()
                            );
                        }
                    } else {
                        if (forList) {
                            let ee = obj[key] as EditableEntity;
                            if (ee.getLabel) {
                                obj[key] = ee.getLabel();
                            }
                        } else {
                            let nestedMeta = this.retrieveMetadata(
                                metadata.fields[key].selfType as string
                            );
                            if (nestedMeta) {
                                let cleanData = await this.cleanData(
                                    req,
                                    obj[key],
                                    nestedMeta
                                );
                                for (let k in cleanData) {
                                    obj[key + '-' + k] = cleanData[k];
                                }
                            }
                            if (obj[key]) {
                                let ee = obj[key] as EditableEntity;
                                if (ee.getId) {
                                    obj[key] = ee.getId();
                                } else {
                                    obj[key] = obj[key].id;
                                }
                            }
                        }
                    }
                }
            }
            if (defaultValues[key]) {
                obj[key] = defaultValues[key];
            }
        }
        obj.getLabel = () => {
            return (_data as any).getLabel();
        };
        obj.getId = () => {
            return (_data as any).getId();
        };
        return obj;
    }

    async setData(
        req: Request,
        entity: BaseEntity,
        data: any,
        metadata: EntityMetadata,
        prefix: string = ''
    ) {
        for (let key in metadata.fields) {
            let m = metadata.fields[key];
            if (m.readOnly instanceof Function) {
                let r = await m.readOnly(req, entity);
                if (r) {
                    continue;
                }
            } else if (m.readOnly) {
                continue;
            }
            let originalMeta = this.retrieveMetadata(entity.constructor.name);
            if (
                m.type == AdminType.ActionButton &&
                req.body['__admin_ui_action'] == key
            ) {
                await (entity as any)[key]();
            }
            if ((entity as any)[key] instanceof Promise) {
                (entity as any)[key] = await (entity as any)[key];
            }
            if (originalMeta.fields[key].values instanceof Function) {
                let values = m.values as any[];
                if (m.type == AdminType.Selection) {
                    let v = values.find((s) => s.key == data[prefix + key]);
                    if (v) {
                        let _class = this.retrieveEntityClass(
                            m.selfType as string
                        );
                        if (!_class) {
                            (entity as any)[key] = v.key;
                        } else {
                            (entity as any)[key] = await _class.findOne(v.key);
                        }
                    } else {
                        (entity as any)[key] = null;
                    }
                }
                if (m.type == AdminType.Checkbox) {
                    let updated = [];
                    if (data[prefix + key] && data[prefix + key].length > 0) {
                        for (let id of data[prefix + key]) {
                            let v = values.find((s) => s.key == id);
                            if (v) {
                                updated.push(
                                    await this.retrieveEntityClass(
                                        m.selfType as string
                                    ).findOne(v.key)
                                );
                            }
                        }
                    }
                    (entity as any)[key] = updated;
                }
            } else if (m.type == AdminType.Checkbox) {
                (entity as any)[key] = data[prefix + key] ? true : false;
            } else if (m.type == AdminType.Expanded) {
                let entityClass = await this.retrieveEntityClass(
                    m.selfType as string
                );
                if (!entityClass) {
                    continue;
                }
                let e = entity as any;
                if (!e[key]) {
                    e[key] = new entityClass();
                }
                let currentMeta = this.retrieveMetadata(m.selfType as string);
                await this.setData(
                    req,
                    e[key],
                    data,
                    currentMeta,
                    prefix + key + '-'
                );
                await Controller.saveEntity(e[key], req);
            } else if (m.type == AdminType.Media) {
                for (let f of req.files) {
                    if (f.fieldname == prefix + key) {
                        let file = await MediaEntity.persist(f, req.user);
                        (entity as any)[key] = file;
                        break;
                    }
                }
            } else if (
                m.type == AdminType.AjaxSelection &&
                data[prefix + key] == '0'
            ) {
                (entity as any)[key] = null;
            } else {
                if (m.selfType == 'Number' && data[prefix + key] === '') {
                    data[prefix + key] = null;
                }
                (entity as any)[key] = data[prefix + key];
            }
        }
    }

    private async evaluateTemplate(
        metadata: EntityMetadata,
        prop: string,
        defaultValue: string,
        req: Request
    ) {
        let meta = metadata as any;
        if (meta.classParameters[prop]) {
            if (meta.classParameters[prop] instanceof Function) {
                meta.classParameters[prop] = await meta.classParameters[prop](
                    req
                );
            }
        }
        if (!meta.classParameters[prop]) {
            meta.classParameters[prop] = defaultValue;
        }
    }

    async generateContextMetadata(
        metadata: EntityMetadata,
        req: Request
    ): Promise<EntityMetadata> {
        let meta = { ...metadata };
        meta.classParameters = { ...metadata.classParameters };
        let requests = [];
        requests.push(
            this.evaluateTemplate(
                meta,
                'listParentTemplate',
                AdminUIModule.listParentTemplatePath,
                req
            )
        );
        requests.push(
            this.evaluateTemplate(
                meta,
                'listTemplate',
                AdminUIModule.listTemplatePath,
                req
            )
        );
        requests.push(
            this.evaluateTemplate(
                meta,
                'editorParentTemplate',
                AdminUIModule.editorParentTemplatePath,
                req
            )
        );
        requests.push(
            this.evaluateTemplate(
                meta,
                'editorTemplate',
                AdminUIModule.editorTemplatePath,
                req
            )
        );
        requests.push(
            this.evaluateTemplate(
                meta,
                'popupEditorParentTemplate',
                AdminUIModule.popupEditorParentTemplatePath,
                req
            )
        );
        requests.push(
            this.evaluateTemplate(
                meta,
                'popupEditorTemplate',
                AdminUIModule.popupEditorTemplatePath,
                req
            )
        );
        requests.push(
            this.evaluateTemplate(meta, 'batchDelete', null as any, req)
        );
        requests.push(
            this.evaluateTemplate(meta, 'disableCreation', null as any, req)
        );
        requests.push(
            this.evaluateTemplate(meta, 'disableDelete', null as any, req)
        );
        requests.push(
            this.evaluateTemplate(meta, 'defaultOrderBy', null as any, req)
        );
        await Promise.all(requests);
        if (
            meta.classParameters.listActionTemplate &&
            meta.classParameters.listActionTemplate instanceof Function
        ) {
            meta.classParameters.listActionTemplate = await (meta
                .classParameters.listActionTemplate as any)(req);
        }
        return meta;
    }

    async generateContextFields(
        metadata: EntityMetadata,
        req: Request,
        entityData: any
    ) {
        let fields = {} as any;
        for (let key in metadata.fields) {
            fields[key] = metadata.fields[key];
        }
        for (let key in fields) {
            let field = fields[key] as FieldParameters;
            if (field.readOnly instanceof Function) {
                fields[key] = { ...field };
                fields[key].readOnly = await (field.readOnly as Function)(
                    req,
                    entityData
                );
                field = fields[key] as FieldParameters;
            }
            if (field.required instanceof Function) {
                fields[key] = { ...field };
                fields[key].required = await (field.required as Function)(
                    req,
                    entityData
                );
                field = fields[key] as FieldParameters;
            }
            if (field.hide instanceof Function) {
                fields[key] = { ...field };
                fields[key].hide = await (field.hide as Function)(
                    req,
                    entityData
                );
                field = fields[key] as FieldParameters;
            }
            if (field.values instanceof Function) {
                fields[key] = { ...field };
                fields[key].values = await (field.values as Function)(
                    req,
                    entityData
                );
            }
            if (field.groupSeparator instanceof Function) {
                fields[key] = { ...field };
                fields[
                    key
                ].groupSeparator = await (field.groupSeparator as Function)(
                    req,
                    entityData
                );
                field = fields[key] as FieldParameters;
            }
            if (field.radixPoint instanceof Function) {
                fields[key] = { ...field };
                fields[key].radixPoint = await (field.radixPoint as Function)(
                    req,
                    entityData
                );
                field = fields[key] as FieldParameters;
            }
            let meta = this.retrieveMetadata(field.selfType as string);
            if (meta) {
                if (!field.query) {
                    let updatedFields: Record<string, FieldParameters> = {};
                    for (let f in meta.fields) {
                        updatedFields[key + '-' + f] = meta.fields[f];
                    }
                    meta = { ...meta, fields: updatedFields };
                }
                fields[key].metadata = meta;
            }
        }
        return fields;
    }

    getUrlWithoutPage(req: Request): string {
        return this.getUrlWithoutParameter(req, ['page']);
    }

    getUrlWithoutOrder(req: Request): string {
        return this.getUrlWithoutParameter(req, ['orderby']);
    }

    getUrlWithoutPageOrOrder(req: Request): string {
        return this.getUrlWithoutParameter(req, ['orderby', 'page']);
    }

    getUrlWithoutParameter(req: Request, parameters: string[]): string {
        let u = (req.baseUrl + req.path).replace(/\/$/, '') + '?';
        for (let key in req.query) {
            var found = false;
            for (let p of parameters) {
                if (key.toLowerCase() == p) {
                    found = true;
                    break;
                }
            }
            if (found) {
                continue;
            }
            u += this.generateQueryValue(key, req.query[key]);
        }
        return u;
    }

    generateQueryValue(key: string, q: any): string {
        let m = key + '=';
        if (q instanceof Array) {
            m += q[0] + '&';
            for (let i = 1; i < q.length; i++) {
                m += key + '=' + q[i] + '&';
            }
            return m;
        }
        return m + q + '&';
    }
}
