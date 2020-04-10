import { BaseController } from "lynx-framework/base.controller";
import { EntityMetadata, AdminType, FieldParameters } from "./decorators";
import BaseEntity from "lynx-framework/entities/base.entity";
import Request from "lynx-framework/request";
import EditableEntity from "./editable-entity";
import { generateSchema } from "./generator";
import { Like, getConnection, Repository } from "typeorm";
import * as moment from "moment";
import Datagrid from "lynx-datagrid/datagrid";

let _adminUI: { entity: any; meta: EntityMetadata }[];
let hasInit = false;

export class Controller extends BaseController {
    async postConstructor() {
        await super.postConstructor();
        if (!hasInit) {
            hasInit = true;
            _adminUI = generateSchema(this.app.config.db.entities);
        }
    }

    get adminUI(): any {
        return _adminUI;
    }

    async retrieveEntity(entityName: string, id: any): Promise<BaseEntity | null> {
        for (let d of this.adminUI) {
            if (d.entity.name == entityName) {
                if (!id || id == "0") {
                    return new d.entity();
                }
                return await d.entity.findOne(id);
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
        let where = {} as any;
        for (let key in metadata.fields) {
            let f = metadata.fields[key];
            let v = datagrid.getQueryValue(key);
            if (f.searchable && v) {
                if (f.type == AdminType.String) {
                    where[key] = Like("%" + (v as string).toLowerCase() + "%");
                } else {
                    where[key] = v;
                }
            }
        }

        let repository = getConnection().getRepository(Class) as Repository<any>;

        await datagrid.fetchData((params) =>
            repository.findAndCount({
                where: where,
                order: params.order,
                skip: params.skip,
                take: params.take,
            })
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
            } else {
                obj[key] = data[key];
                if (obj[key] instanceof Object) {
                    if (obj[key] instanceof Promise) {
                        obj[key] = await obj[key];
                    } else if (obj[key] instanceof Date) {
                        obj[key] = moment(data[key]).format("YYYY-MM-DD");
                    } else if (obj[key] instanceof Array) {
                        if (forList) {
                            obj[key] = obj[key].map((e: EditableEntity) => e.getLabel());
                        } else {
                            obj[key] = obj[key].map((e: EditableEntity) => e.getId());
                        }
                    } else {
                        if (forList) {
                            obj[key] = (obj[key] as EditableEntity).getLabel();
                        } else {
                            obj[key] = (obj[key] as EditableEntity).getId();
                        }
                    }
                }
            }
        }
        return obj;
    }

    async setData(req: Request, entity: BaseEntity, data: any, metadata: EntityMetadata) {
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
            if (m.values instanceof Function) {
                let values = await m.values(req, entity);
                if (m.type == AdminType.Selection) {
                    let v = values.find((s) => s.key == data[key]);
                    if (v) {
                        (entity as any)[key] = await this.retrieveEntityClass(m.selfType as string).findOne(v.key);
                    }
                }
                if (m.type == AdminType.Checkbox) {
                    let updated = [];
                    if (data[key] && data[key].length > 0) {
                        for (let id of data[key]) {
                            let v = values.find((s) => s.key == id);
                            if (v) {
                                updated.push(await this.retrieveEntityClass(m.selfType as string).findOne(v.key));
                            }
                        }
                    }
                    (entity as any)[key] = updated;
                }
            } else if (m.type == AdminType.Checkbox) {
                (entity as any)[key] = data[key] ? true : false;
            } else {
                (entity as any)[key] = data[key];
            }
        }
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
            if (field.values instanceof Function) {
                fields[key] = { ...field };
                fields[key].values = await (field.values as Function)(req, entityData);
            }
            let meta = this.retrieveMetadata(field.selfType as string);
            if (meta) {
                console.log("metadata found for " + field.selfType);
                console.log(meta.fields);
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
