import { BaseController } from "lynx-framework/base.controller";
import { EntityMetadata, AdminType, FieldParameters } from "./decorators";
import BaseEntity from "lynx-framework/entities/base.entity";
import MediaEntity from "lynx-framework/entities/media.entity";
import Request from "lynx-framework/request";
import EditableEntity from "./editable-entity";
import { generateSchema } from "./generator";
import { Like, getConnection, Repository } from "typeorm";
import * as moment from "moment";
import Datagrid from "lynx-datagrid/datagrid";
import AdminUIModule from ".";

let _adminUI: { entity: any; meta: EntityMetadata }[];
let hasInit = false;

export class Controller extends BaseController {

    static async saveEntity(entity: any): Promise<any> {
        if ((entity as EditableEntity).onBeforeSave) {
            await entity.onBeforeSave();
        }
        let updated = await entity.save();
        if ((updated as EditableEntity).onAfterSave) {
            await updated.onAfterSave();
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

    entitiesList(): {name: string, readableName: string}[] {
        let list = [];
        for (let d of this.adminUI) {
            list.push({
                name: d.entity.name,
                readableName: d.meta.name
            });
        }
        return list;
    }

    async retrieveEntity(entityName: string, id: any): Promise<BaseEntity | null> {
        for (let d of this.adminUI) {
            if (d.entity.name == entityName) {
                if (!id || id == "0") {
                    return new d.entity();
                }
                return await d.entity.findOne(id, { relations: d.meta.classParameters.relations });
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

    async retrieveData(req: Request, entityName: string, id: any): Promise<any> {
        let current = await this.retrieveEntity(entityName, id);
        if (!current) {
            if (!id || id == 0) {
                return new (this.retrieveEntityClass(entityName))();
            }
            return null;
        }
        return await this.cleanData(req, current, this.retrieveMetadata(entityName));
    }

    async retrieveList(req: Request, entityName: string, datagrid: Datagrid<any>): Promise<void> {
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
        let hasSmartSearchable = false;
        for (let key in metadata.fields) {
            let f = metadata.fields[key];
            let v = datagrid.getQueryValue(key) || datagrid.getQueryValue('smartSearch');
            if ((f.searchable || f.smartSearchable) && v) {
                if (f.smartSearchable) {
                    hasSmartSearchable = true;
                }
                if (f.type == AdminType.String) {
                    where[key] = Like("%" + (v as string).toLowerCase() + "%");
                } else {
                    where[key] = v;
                }
            }
        }

        let repository = getConnection().getRepository(Class) as Repository<any>;

        if (!hasSmartSearchable) {
            if (filterWhere) {
                where = { ...filterWhere, ...where};
            }
        } else {
            let ors = [] as any[];
            for (let key in where) {
                let tmp = {...filterWhere} as any;
                tmp[key] = where[key];
                ors.push(tmp);
            }
            where = ors;
        }

        await datagrid.fetchData((params) => { 
            let order = params.order;
            if (Object.keys(order).length == 0 && metadata.classParameters.defaultOrderBy) {
                let tmp = metadata.classParameters.defaultOrderBy as string;
                if (tmp.startsWith("-")) {
                    order[tmp.substring(1)] = 'ASC';
                  } else if (tmp.startsWith("+")) {
                    order[tmp.substring(1)] = 'DESC';
                  } else {
                    order[tmp] = 'DESC';
                  }
            }
            return repository.findAndCount({
                    where: where,
                    order: order,
                    skip: params.skip,
                    take: params.take,
                    relations: metadata.classParameters.relations
                }); 
            }
        );
        let tmp = datagrid.data as BaseEntity[];
        let promises: Promise<void>[] = [];
        tmp.forEach((t) => promises.push(t.reload()));
        await Promise.all(promises);
        for (let i = 0; i < datagrid.data.length; i++) {
            datagrid.data[i] = await this.cleanData(req, datagrid.data[i], metadata, true);
        }
    }

    async cleanData(req: Request, _data: BaseEntity, metadata: EntityMetadata, forList?: boolean) {
        let obj = {} as any;
        let data = _data as any;
        let defaultValues = {} as any;
        if (req.query.defaultValues) {
            defaultValues = JSON.parse(req.query.defaultValues as string);
        }
        for (let key in metadata.fields) {
            if (metadata.fields[key].query) {
                let executor = metadata.fields[key].query as any;
                let datagrid = new Datagrid(key+'-', req);
                await datagrid.fetchData((params) => executor(req, data, params));
                let gridMetadata = this.retrieveMetadata(metadata.fields[key].selfType as string);
                if (gridMetadata) {
                    for (let i = 0; i < datagrid.data.length; i++) {
                        datagrid.data[i] = await this.cleanData(req, datagrid.data[i] as BaseEntity, gridMetadata, true);
                    }
                }
                obj[key] = datagrid;
                obj[key + '__disable_creation'] = false;
                if (metadata.fields[key].max) {
                    if (datagrid.length >= (metadata.fields[key].max as number)) {
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
                            obj[key] = obj[key].map((e: EditableEntity) => e.getLabel());
                        } else {
                            obj[key] = obj[key].map((e: EditableEntity) => e.getId());
                        }
                    } else {
                        if (forList) {
                            let ee = (obj[key] as EditableEntity);
                            if (ee.getLabel) {
                                obj[key] = ee.getLabel();
                            } else if (ee.toString) {
                                obj[key] = ee.toString();
                            }
                        } else {
                            let nestedMeta = this.retrieveMetadata(metadata.fields[key].selfType as string);
                            if (nestedMeta) { 
                                let cleanData = await this.cleanData(req, obj[key], nestedMeta)
                                for (let k in cleanData) {
                                    obj[key+'-'+k] = cleanData[k];
                                }
                            } 
                            let ee = (obj[key] as EditableEntity);
                            if (ee.getId) {
                                obj[key] = ee.getId();
                            } else {
                                obj[key] = obj[key].id;
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
        }
        obj.getId = () => {
            return (_data as any).getId();
        }
        return obj;
    }

    async setData(req: Request, entity: BaseEntity, data: any, metadata: EntityMetadata, prefix: string = '') {
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
            if (m.type == AdminType.ActionButton && req.body['__admin_ui_action'] == key) {
                await (entity as any)[key]();
            }
            if (originalMeta.fields[key].values instanceof Function) {
                let values = m.values as any[];
                if (m.type == AdminType.Selection) {
                    let v = values.find((s) => s.key == data[prefix+key]);
                    if (v) {
                        let _class = this.retrieveEntityClass(m.selfType as string);
                        if (!_class) {
                            (entity as any)[key] = v.key;
                        } else {
                            (entity as any)[key] = await _class.findOne(v.key);
                        }
                    }
                }
                if (m.type == AdminType.Checkbox) {
                    let updated = [];
                    if (data[prefix+key] && data[prefix+key].length > 0) {
                        for (let id of data[prefix+key]) {
                            let v = values.find((s) => s.key == id);
                            if (v) {
                                updated.push(await this.retrieveEntityClass(m.selfType as string).findOne(v.key));
                            }
                        }
                    }
                    (entity as any)[key] = updated;
                }
            } else if (m.type == AdminType.Checkbox) {
                (entity as any)[key] = data[prefix+key] ? true : false;
            } else if (m.type == AdminType.Expanded) {
                let entityClass = await this.retrieveEntityClass(m.selfType as string);
                if (!entityClass) {
                    continue;
                }
                let e = entity as any;
                if (!e[key]) {
                    e[key] = new entityClass();
                }
                let currentMeta = this.retrieveMetadata(m.selfType as string);
                await this.setData(req, e[key], data, currentMeta, prefix+key+'-');
                await Controller.saveEntity(e[key]);
            } else if (m.type == AdminType.Media) {
                for (let f of req.files) {
                    if (f.fieldname == prefix + key) {
                        let file = await MediaEntity.persist(f, req.user);
                        (entity as any)[key] = file;
                        break;
                    }
                }
            } else {
                (entity as any)[key] = data[prefix+key];
            }
        }
    }

    private async evaluateTemplate(metadata: EntityMetadata, prop: string, defaultValue: string, req: Request) {
        let meta = metadata as any;
        if (meta.classParameters[prop]) {
            if (meta.classParameters[prop] instanceof Function) {
                meta.classParameters[prop] = await meta.classParameters[prop](req);
            }
        } 
        if (!meta.classParameters[prop]) {
            meta.classParameters[prop] = defaultValue;
        }
    }

    async generateContextMetadata(metadata: EntityMetadata, req: Request): Promise<EntityMetadata> {
        let meta = {...metadata};
        meta.classParameters = {...metadata.classParameters};
        let requests = [];
        requests.push(this.evaluateTemplate(meta, 'listParentTemplate', AdminUIModule.listParentTemplatePath, req));
        requests.push(this.evaluateTemplate(meta, 'listTemplate', AdminUIModule.listTemplatePath, req));
        requests.push(this.evaluateTemplate(meta, 'editorParentTemplate', AdminUIModule.editorParentTemplatePath, req));
        requests.push(this.evaluateTemplate(meta, 'editorTemplate', AdminUIModule.editorTemplatePath, req));
        requests.push(this.evaluateTemplate(meta, 'popupEditorParentTemplate', AdminUIModule.popupEditorParentTemplatePath, req));
        requests.push(this.evaluateTemplate(meta, 'popupEditorTemplate', AdminUIModule.popupEditorTemplatePath, req));
        requests.push(this.evaluateTemplate(meta, 'batchDelete', null as any, req));
        requests.push(this.evaluateTemplate(meta, 'disableCreation', null as any, req));
        requests.push(this.evaluateTemplate(meta, 'defaultOrderBy', null as any, req));
        await Promise.all(requests);
        if (meta.classParameters.listActionTemplate && meta.classParameters.listActionTemplate instanceof Function) {
            meta.classParameters.listActionTemplate = await (meta.classParameters.listActionTemplate as any)(req);
        } 
        return meta;
    }

    async generateContextFields(metadata: EntityMetadata, req: Request, entityData: any) {
        let fields = {} as any;
        for (let key in metadata.fields) {
            fields[key] = metadata.fields[key];
        }
        for (let key in fields) {
            let field = fields[key] as FieldParameters;
            if (field.readOnly instanceof Function) {
                fields[key] = { ...field };
                fields[key].readOnly = await (field.readOnly as Function)(req, entityData);
                field = fields[key] as FieldParameters;
            }
            if (field.hide instanceof Function) {
                fields[key] = { ...field };
                fields[key].hide = await (field.hide as Function)(req, entityData);
                field = fields[key] as FieldParameters;
            }
            if (field.values instanceof Function) {
                fields[key] = { ...field };
                fields[key].values = await (field.values as Function)(req, entityData);
            }
            let meta = this.retrieveMetadata(field.selfType as string);
            if (meta) {
                if (!field.query) {
                    let updatedFields: Record<string, FieldParameters> = {};
                    for (let f in meta.fields) {
                        updatedFields[key+'-'+f] = meta.fields[f];
                    }
                    meta = {...meta, fields: updatedFields};
                }
                fields[key].metadata = meta;
            }
        }
        return fields;
    }

    getUrlWithoutPage(req: Request): string {
        return this.getUrlWithoutParameter(req, ["page"]);
    }

    getUrlWithoutOrder(req: Request): string {
        return this.getUrlWithoutParameter(req, ["orderby"]);
    }

    getUrlWithoutPageOrOrder(req: Request): string {
        return this.getUrlWithoutParameter(req, ["orderby", "page"]);
    }

    getUrlWithoutParameter(req: Request, parameters: string[]): string {
        let u = (req.baseUrl + req.path).replace(/\/$/, "") + "?";
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
        let m = key + "=";
        if (q instanceof Array) {
            m += q[0] + "&";
            for (let i = 1; i < q.length; i++) {
                m += key + "=" + q[i] + "&";
            }
            return m;
        }
        return m + q + "&";
    }
}
