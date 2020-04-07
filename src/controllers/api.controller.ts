import { Route, GET, POST, DELETE, API } from "lynx-framework/decorators";
import BaseEntity from "lynx-framework/entities/base.entity";
import Request from "lynx-framework/request";
import { Controller } from "../controller";

@Route("/adminUI/api")
export default class ApiController extends Controller {

    @API()
    @GET("/:entityName")
    async list(entityName: string, req: Request) {
        let Class = this.retrieveEntityClass(entityName);
        if (!Class) {
            throw this.error(404, 'not found');
        }
        let metadata = this.retrieveMetadata(entityName); 
        let selections = [] as string[];
        let where = {} as any;
        metadata.fields.forEach((f, key) => {
            if (f.onSummary) {
                selections.push(key);
            }
            if (f.searchable && req.query[key]) {
                where[key] = req.query[key];
            }
        });
        let orderBy: any = null;
        if (req.query.orderBy) {
            orderBy = {};
            let o = req.query.orderBy as string;
            if (o.startsWith('-')) {
                orderBy[req.query.orderBy.substring(1)] = 'ASC';
            } else if (o.startsWith('+')) {
                orderBy[req.query.orderBy.substring(1)] = 'DESC';
            }
        }
        let all = await Class.find({where: where, select: selections, order: orderBy, skip: req.query.skip, take: req.query.take});
        return all.map((element:any) => this.cleanData(element, metadata));

    }

    @API()
    @GET("/:entityName/:id")
    async details(entityName: string, id: any) {
        let data = await this.retrieveData(entityName, id);
        if (!data) {
            throw this.error(404, 'not found');
        }
        return data;
    }

    @API()
    @POST("/:entityName/:id")
    async edit(entityName: string, id: any, req: Request) {
        let metadata = this.retrieveMetadata(entityName);
        if (!metadata) {
            throw this.error(404, 'not found');
        }
        let entity: BaseEntity;
        if (!id || id == 0) {
            entity = new (this.retrieveEntityClass(entityName))();
        } else {
            entity = (await this.retrieveEntity(entityName, id) as BaseEntity);
            if (!entity) {
                throw this.error(404, 'not found');
            }
        }
        this.setData(req, entity, req.body, metadata);
        await entity.save();
        return true;
    }


    @API()
    @DELETE("/:entityName/:id") 
    async performDelete(entityName: string, id: any) {
        let entity = (await this.retrieveEntity(entityName, id) as BaseEntity);
        if (!entity) {
            throw this.error(404, 'not found');
        }
        await entity.remove();
        return true;
    }



}
