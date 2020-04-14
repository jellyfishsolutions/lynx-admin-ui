import { Route, GET, POST, Name } from "lynx-framework/decorators";
import { Controller } from "../controller";
import Request from "lynx-framework/request";
import BaseEntity from "lynx-framework/entities/base.entity";
import AdminUIModule from "..";
import Datagrid from "lynx-datagrid/datagrid";

@Route("/adminUI/")
export default class UIController extends Controller {

    @Name("adminUI.list")
    @GET("/:entityName")
    async list(entityName: string, req: Request) {
        let metadata = this.retrieveMetadata(entityName);
        if (!metadata) {
            throw this.error(404, 'Not found');
        }
        let datagrid = new Datagrid('', req);
        await this.retrieveList(req, entityName, datagrid);
        let ctx = {
            metadata: metadata,
            configuration: AdminUIModule.configuration,
            parentTemplate: AdminUIModule.listParentTemplatePath,
            gridData: datagrid,
            data: req.query,
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
        let data = await this.cleanData(req, entityData, metadata);
        let isPopup = req.query.popup;
        let ctx = {
            data: data,
            configuration: AdminUIModule.configuration,
            parentTemplate: isPopup ? AdminUIModule.popupEditorParentTemplatePath : AdminUIModule.editorParentTemplatePath,
            nested: false,
            metadata: metadata,
            fields: await this.generateContextFields(metadata, req, entityData)
        } as any;
        return this.render(isPopup ? AdminUIModule.popupEditorTemplatePath : AdminUIModule.editorTemplatePath, req, ctx);
    }

    @Name("adminUI.nested")
    @GET("/:entityName/:id/:nestedKey")
    async nestedView(entityName: string, id: any, nestedKey: string, req: Request) {
        let entityData = await this.retrieveEntity(entityName, id);
        if (!entityData) {
            throw this.error(404, 'not found');
        }
        let metadata = {...this.retrieveMetadata(entityName)};
        let nestedField = metadata.fields[nestedKey];
        metadata.fields = {};
        metadata.fields[nestedKey] = nestedField;
        let data = await this.cleanData(req, entityData, metadata);
        let ctx = {
            data: data,
            configuration: AdminUIModule.configuration,
            parentTemplate: AdminUIModule.nestedParentTemplatePath,
            nested: true,
            metadata: metadata,
            fields: await this.generateContextFields(metadata, req, entityData)
        } as any;
        return this.render(AdminUIModule.nestedTemplatePath, req, ctx);
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
            await entity.save();
        } else {
            entity = (await this.retrieveEntity(entityName, id) as BaseEntity);
            if (!entity) {
                throw this.error(404, 'not found');
            }
        }
        metadata = {...metadata, fields: await this.generateContextFields(metadata, req, entity) } 
        await this.setData(req, entity, req.body, metadata);
        let updated = await entity.save();
        return this.redirect("adminUI.details", {entityName: entityName, id: (updated as any).id});
    }
}