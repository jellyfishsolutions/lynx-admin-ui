import {
    Route,
    GET,
    POST,
    Name,
    IsDisabledOn,
    MultipartForm,
    API,
} from 'lynx-framework/decorators';
import Request from 'lynx-framework/request';
import MediaEntity from 'lynx-framework/entities/media.entity';
import { BaseUIController } from '../base-ui-controller';

@Route('/adminUI/')
export default class UIController extends BaseUIController {
    @IsDisabledOn(() => false)
    @Name('adminUI.index')
    @GET('/')
    async getIndex(req: Request) {
        return this.generateEntitiesIndex(req);
    }

    @Name('adminUI.previewMedia')
    @GET('/media/preview/:id')
    async mediaPreview(id: any, req: Request) {
        let media = await MediaEntity.findBySlugOrId(id);
        if (!media) {
            throw this.error(404, 'Media not found');
        }
        try {
            return this.download(media, { width: 300 });
        } catch (e) {
            throw this.error(500, e);
        }
    }

    @Name('adminUI.ajax-selection')
    @API()
    @GET('/ajaxRequest/:entityName/:id/:field')
    async ajaxRequest(
        entityName: string,
        id: any,
        field: string,
        req: Request
    ) {
        return this.performAjaxRequest(entityName, id, field, req);
    }

    @Name('adminUI.delete')
    @POST('/:entityName/:id/delete')
    async performDelete(entityName: string, id: any, req: Request) {
        return this.performEntityDelete(entityName, id, req);
    }

    @Name('adminUI.delete_multiple')
    @POST('/:entityName/delete_multiple')
    async performMultipleDelete(entityName: string, req: Request) {
        return this.performEntityDeleteMultiple(entityName, req);
    }

    @Name('adminUI.list')
    @GET('/:entityName')
    async list(entityName: string, req: Request) {
        return this.retrieveEntityList(entityName, req);
    }

    @Name('adminUI.details')
    @GET('/:entityName/:id')
    async details(entityName: string, id: any, req: Request) {
        return this.retrieveEntityDetails(entityName, id, req);
    }

    @Name('adminUI.nested')
    @GET('/:entityName/:id/:nestedKey')
    async nestedView(
        entityName: string,
        id: any,
        nestedKey: string,
        req: Request
    ) {
        return this.retrieveNestedView(entityName, id, nestedKey, req);
    }

    @Name('adminUI.nested.delete')
    @POST('/:entityName/:id/:nestedKey')
    async deleteNested(
        entityName: string,
        id: any,
        nestedKey: string,
        req: Request
    ) {
        return this.retrieveNestedView(entityName, id, nestedKey, req, true);
    }

    @Name('adminUI.save')
    @MultipartForm()
    @POST('/:entityName/:id')
    async edit(entityName: string, id: any, req: Request) {
        return this.performEntityEdit(entityName, id, req);
    }
}
