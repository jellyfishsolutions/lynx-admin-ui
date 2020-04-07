import { Route, GET, POST, Name } from "lynx-framework/decorators";
import { Controller } from "../controller";
import Request from "lynx-framework/request";
import BaseEntity from "lynx-framework/entities/base.entity";
import AdminUIModule from "..";

@Route("/adminUI/")
export default class UIController extends Controller {

    @Name("adminUI.list")
    @GET("/:entityName")
    async list(entityName: string, req: Request) {
        let metadata = this.retrieveMetadata(entityName);
        if (!metadata) {
            throw this.error(404, 'Not found');
        }
        let [allData, total] = await this.retrieveList(entityName, req);
        let pageSize = req.query.pageSize || 10;
        let currentPage = (req.query.page || 1) - 1;
        let pageCount = Math.ceil(total / pageSize);
        let maxPages = 10;
        let ctx = {
            metadata: metadata,
            configuration: AdminUIModule.configuration,
            parentTemplate: AdminUIModule.listParentTemplatePath,
            gridData: allData,
            data: req.query,
            urlNoPageNoOrder: this.getUrlWithoutPageOrOrder(req),
            urlNoPage: this.getUrlWithoutPage(req),
            paging: {
                currentPage: currentPage,
                pageCount: pageCount,
                left: Math.max(0, currentPage - maxPages),
                right: Math.min(pageCount, currentPage + 1 + maxPages)
            },
            needsDesc: () => {
                let order = req.query.orderBy;
                if (order && !order.startsWith('-')) {
                    return true;
                }
                return false;
            },
            fields: await this.generateContextFields(metadata, req, {})
        } as any;
        return this.render(AdminUIModule.listTemplatePath, req, ctx);
    }

    @Name("adminUI.details")
    @GET("/:entityName/:id")
    async details(entityName: string, id: any, req: Request) {
        let entityData = await this.retrieveEntity(entityName, id);
        if (!entityData) {
            throw this.error(404, 'not found');
        }
        let metadata = this.retrieveMetadata(entityName);
        let data = await this.cleanData(entityData, metadata);
        let ctx = {
            data: data,
            configuration: AdminUIModule.configuration,
            parentTemplate: AdminUIModule.editorParentTemplatePath,
            metadata: metadata,
            fields: await this.generateContextFields(metadata, req, entityData)
        } as any;
        return this.render(AdminUIModule.editorTemplatePath, req, ctx);
    }

    @Name("adminUI.save")
    @POST("/:entityName/:id")
    async edit(entityName: string, id: any, req: Request) {
        let metadata = this.retrieveMetadata(entityName);
        if (!metadata) {
            throw this.error(404, 'not found');
        }
        let entity: BaseEntity;
        if (!id || id == '0') {
            entity = new (this.retrieveEntityClass(entityName))();
        } else {
            entity = (await this.retrieveEntity(entityName, id) as BaseEntity);
            if (!entity) {
                throw this.error(404, 'not found');
            }
        }
        await this.setData(req, entity, req.body, metadata);
        let updated = await entity.save();
        return this.redirect("adminUI.details", {entityName: entityName, id: (updated as any).id});
    }
}