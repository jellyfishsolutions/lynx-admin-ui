import { Controller } from './controller';
import Request from 'lynx-framework/request';
import AdminUIModule from '.';
import Datagrid from 'lynx-datagrid/datagrid';
import BaseEntity from 'lynx-framework/entities/base.entity';
import Response from 'lynx-framework/response';
import EditableEntity from './editable-entity';

import { sprintf } from 'sprintf-js';

/**
 * Basic controller that generates all the UI that contains the logic to perform the
 * different operations.
 */
export class BaseUIController extends Controller {
    /**
     * Generate the list of entities
     * @param req The current Lynx request
     */
    async generateEntitiesIndex(req: Request): Promise<Response> {
        let ctx = {
            parentTemplate: AdminUIModule.indexParentTemplatePath,
            entities: this.entitiesList(),
        };
        return this.render(AdminUIModule.indexTemplatePath, req, ctx);
    }

    /**
     * Perform ajax request for selection values
     * @param entityName the name of the entity
     * @param id the id of the editing entity
     * @param field the name of the field that is edited
     * @param req the current Lynx request
     */
    async performAjaxRequest(
        entityName: string,
        id: any,
        field: string,
        req: Request
    ) {
        let entityData = await this.retrieveEntity(entityName, id);
        if (!entityData) {
            throw this.error(404, 'not found');
        }
        let metadata = this.retrieveMetadata(entityName);
        metadata = await this.generateContextMetadata(metadata, req);
        let _field = metadata.fields[field];
        if (!_field) {
            throw this.error(500, 'field not found');
        }
        if (!_field.searchRequest) {
            throw this.error(
                500,
                "You need to implement the 'searchRequest' parameter for the field '" +
                    field +
                    "'"
            );
        }
        if (req.query.selection) {
            let tmp = (entityData as any)[field] as EditableEntity;
            return {
                data: [{ id: tmp.getId(), text: tmp.getLabel() }],
                pagination: false,
            };
        }
        let response = await _field.searchRequest(
            req,
            entityData,
            req.query.term as string,
            Number(req.query.page)
        );
        return {
            data: response[0].map((b) => {
                return { id: b.key, text: b.value };
            }),
            pagination: response[1],
        };
    }

    /**
     * Delete the specified entity.
     * @param entityName The name of the entity class
     * @param id  The id of the entity
     * @param req The current Lynx request
     */
    async performEntityDelete(
        entityName: string,
        id: any,
        req: Request
    ): Promise<Response> {
        let entityData = await this.retrieveEntity(entityName, id);
        if (!entityData) {
            throw this.error(404, 'not found');
        }
        try {
            await entityData.remove();
        } catch (e) {
            this.logger.error(e);
            let msg = this.tr('admin-ui.unable-delete', req);
            this.addErrorMessage(
                sprintf(msg, (entityData as any).getLabel()),
                req
            );
        }
        if (req.query.redirect as string) {
            return this.redirect(req.query.redirect as string);
        }
        return this.redirect('adminUI.list', { entityName: entityName });
    }

    /**
     * Delete the specified entities.
     * @param entityName The name of the entity class
     * @param req The current Lynx request, containing the query parameter ids, with an array of id
     */
    async performEntityDeleteMultiple(
        entityName: string,
        req: Request
    ): Promise<Response> {
        let ids = JSON.parse(req.query.ids as string) as string[];

        for (let id of ids) {
            let entityData = await this.retrieveEntity(entityName, id);
            if (!entityData) {
                throw this.error(404, 'not found');
            }
            try {
                await entityData.remove();
            } catch (e) {
                this.logger.error(e);
                let msg = this.tr('admin-ui.unable-delete', req);
                this.addErrorMessage(
                    sprintf(msg, (entityData as any).getLabel()),
                    req
                );
            }
        }
        if (req.query.redirect as string) {
            return this.redirect(req.query.redirect as string);
        }
        return this.redirect('adminUI.list', { entityName: entityName });
    }

    /**
     * Retrieve and display the list of a specified entity
     * @param entityName The name of the entity class
     * @param req The current Lynx request
     */
    async retrieveEntityList(
        entityName: string,
        req: Request
    ): Promise<Response> {
        let metadata = this.retrieveMetadata(entityName);
        if (!metadata) {
            throw this.error(404, 'Not found');
        }
        let datagrid = new Datagrid('', req);
        await this.retrieveList(req, entityName, datagrid);
        metadata = await this.generateContextMetadata(metadata, req);
        let fields = await this.generateContextFields(metadata, req, {});
        let hasSmartSearchable = false;
        for (let key in fields) {
            let field = fields[key];
            if (field.smartSearchable) {
                hasSmartSearchable = true;
                break;
            }
        }
        let data: any = {};
        for (let k in req.query) {
            let tmp = req.query[k];
            if (tmp instanceof Array) {
                let u = [];
                for (let t of tmp) {
                    try {
                        u.push(parseInt(t as string));
                    } catch (e) {
                        u.push(t);
                    }
                }
                tmp = u as any;
            }
            data[k] = tmp;
        }
        let ctx = {
            metadata: metadata,
            configuration: AdminUIModule.configuration,
            parentTemplate: metadata.classParameters.listParentTemplate,
            gridData: datagrid,
            data: data,
            fields: fields,
            hasSmartSearchable: hasSmartSearchable,
        } as any;
        return this.render(
            metadata.classParameters.listTemplate as string,
            req,
            ctx
        );
    }

    /**
     * Retrieve the details of a specific entity by its id
     * @param entityName The name of the entity class
     * @param id The id of the entity to retrieve
     * @param req The current Lynx request
     */
    async retrieveEntityDetails(
        entityName: string,
        id: any,
        req: Request
    ): Promise<Response> {
        let entityData = await this.retrieveEntity(entityName, id);
        if (!entityData) {
            throw this.error(404, 'not found');
        }
        let metadata = this.retrieveMetadata(entityName);
        metadata = await this.generateContextMetadata(metadata, req);
        let data = await this.cleanData(req, entityData, metadata);
        let fields = await this.generateContextFields(
            metadata,
            req,
            entityData
        );
        let usedTypes: string[] = [];
        for (let key in fields) {
            if (usedTypes.indexOf(fields[key].type) == -1) {
                usedTypes.push(fields[key].type);
            }
        }

        let isPopup = req.query.popup;
        let ctx = {
            data: data,
            configuration: AdminUIModule.configuration,
            parentTemplate: isPopup
                ? metadata.classParameters.popupEditorParentTemplate
                : metadata.classParameters.editorParentTemplate,
            nested: false,
            metadata: metadata,
            fields: fields,
            usedTypes: usedTypes,
        } as any;
        return this.render(
            isPopup
                ? (metadata.classParameters.popupEditorTemplate as string)
                : (metadata.classParameters.editorTemplate as string),
            req,
            ctx
        );
    }

    /**
     * Retrieve the nested view of an entity
     * @param entityName The name of the entity class
     * @param id The id of the entity to retrieve
     * @param nestedKey The name of the property of the entity to display
     * @param req The current Lynx request
     */
    async retrieveNestedView(
        entityName: string,
        id: any,
        nestedKey: string,
        req: Request
    ): Promise<Response> {
        let entityData = await this.retrieveEntity(entityName, id);
        if (!entityData) {
            throw this.error(404, 'not found');
        }
        let metadata = { ...this.retrieveMetadata(entityName) };
        metadata = await this.generateContextMetadata(metadata, req);
        let nestedField = metadata.fields[nestedKey];
        metadata.fields = {};
        metadata.fields[nestedKey] = nestedField;

        if (req.query.remove) {
            let entityData = await this.retrieveEntity(
                nestedField.selfType as string,
                req.query.remove
            );
            if (!entityData) {
                throw this.error(404, 'not found');
            }
            try {
                await entityData.remove();
            } catch (e) {
                this.logger.error(e);
                this.addErrorMessage(
                    'Unable to delete ' +
                        (entityData as any).getLabel() +
                        '. Please check its dependencies.',
                    req
                );
            }
        }

        let data = await this.cleanData(req, entityData, metadata);
        let ctx = {
            data: data,
            configuration: AdminUIModule.configuration,
            parentTemplate: AdminUIModule.nestedParentTemplatePath,
            nested: true,
            metadata: metadata,
            fields: await this.generateContextFields(metadata, req, entityData),
        } as any;
        return this.render(AdminUIModule.nestedTemplatePath, req, ctx);
    }

    /**
     * Perform the edit of a specific entity
     * @param entityName The name of the entity class
     * @param id The id of the entity to edit
     * @param req The current Lynx request
     */
    async performEntityEdit(
        entityName: string,
        id: any,
        req: Request
    ): Promise<Response> {
        let metadata = this.retrieveMetadata(entityName);
        if (!metadata) {
            throw this.error(404, 'not found');
        }
        let entity: BaseEntity;
        if (!id || id == '0') {
            let repo = this.retrieveEntityClass(entityName);
            if (repo?.factory !== undefined) {
                entity = repo.factory() as any;
            } else {
                entity = new (repo as any)();
            }
        } else {
            entity = (await this.retrieveEntity(entityName, id)) as BaseEntity;
            if (!entity) {
                throw this.error(404, 'not found');
            }
        }
        metadata = {
            ...metadata,
            fields: await this.generateContextFields(metadata, req, entity),
        };
        await this.setData(req, entity, req.body, metadata);
        let updated;
        try {
            updated = await Controller.saveEntity(entity, req);
        } catch (e) {
            console.log('error saving the entity', e);
            try {
                let errorField = (/'([a-zA-Z0-0_)]+)'/.exec(
                    e.message
                ) as any)[1];
                let field = metadata.fields[errorField];
                if (field) {
                    this.addErrorMessage('Error on field ' + field.name, req);
                } else {
                    this.addErrorMessage(e.message, req);
                }
            } catch (ee) {
                this.logger.error(e);
                this.logger.error(ee);
                this.addErrorMessage(e.message, req);
            }
            metadata = await this.generateContextMetadata(metadata, req);
            let isPopup = req.query.popup;
            let ctx = {
                data: req.body,
                configuration: AdminUIModule.configuration,
                parentTemplate: isPopup
                    ? metadata.classParameters.popupEditorParentTemplate
                    : metadata.classParameters.editorParentTemplate,
                nested: false,
                metadata: metadata,
                fields: await this.generateContextFields(metadata, req, entity),
            } as any;
            return this.render(
                isPopup
                    ? (metadata.classParameters.popupEditorTemplate as string)
                    : (metadata.classParameters.editorTemplate as string),
                req,
                ctx
            );
        }
        if (id == 0) {
            this.addSuccessMessage('admin-ui.success-create', req);
        } else {
            this.addSuccessMessage('admin-ui.success-update', req);
        }
        return this.redirect('adminUI.details', {
            entityName: entityName,
            id: (updated as any).id,
        });
    }
}
