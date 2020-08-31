import { Route, GET, POST, Name, IsDisabledOn, MultipartForm } from "lynx-framework/decorators";
import Request from "lynx-framework/request";
import MediaEntity from "lynx-framework/entities/media.entity";
import { BaseUIController } from "../base-ui-controller";

@Route("/adminUI/")
export default class UIController extends BaseUIController {

    @IsDisabledOn(() => false)
    @Name("adminUI.index")
    @GET("/")
    async getIndex(req: Request) {
        return this.generateEntitiesIndex(req);
    }

    @Name("adminUI.previewMedia")
    @GET("/media/preview/:id")
    async mediaPreview(id: any, req: Request) {
        console.log('cerco la media con id ', id);
        let media = await MediaEntity.findBySlugOrId(id);
        if (!media) {
            console.log('non la trovo');
            throw this.error(404, 'Media not found');
        }
        return this.download(media, { width: 300 });
    }

    @Name("adminUI.delete")
    @GET("/:entityName/:id/delete")
    async performDelete(entityName: string, id: any, req: Request) {
        return this.performEntityDelete(entityName, id, req);
    }

    @Name("adminUI.delete_multiple")
    @GET("/:entityName/delete_multiple")
    async performMultipleDelete(entityName: string, req: Request) {
        return this.performEntityDeleteMultiple(entityName, req);
    }

    @Name("adminUI.list")
    @GET("/:entityName")
    async list(entityName: string, req: Request) {
        return this.retrieveEntityList(entityName, req);
    }

    @Name("adminUI.details")
    @GET("/:entityName/:id")
    async details(entityName: string, id: any, req: Request) {
        return this.retrieveEntityDetails(entityName, id, req);
    }

    @Name("adminUI.nested")
    @GET("/:entityName/:id/:nestedKey")
    async nestedView(entityName: string, id: any, nestedKey: string, req: Request) {
        return this.retrieveNestedView(entityName, id, nestedKey, req);
    }

    @Name("adminUI.save")
    @MultipartForm()
    @POST("/:entityName/:id")
    async edit(entityName: string, id: any, req: Request) {
        return this.performEntityEdit(entityName, id, req);
    }

}