import { app } from 'lynx-framework/app';
import { Request, Response } from 'express';
import SimpleModule from 'lynx-framework/simple.module';
import { AdminType } from './decorators';

export default class AdminUIModule extends SimpleModule {
    static configuration: any = {};
    static indexParentTemplatePath = '/admin-ui/layouts/base';
    static indexTemplatePath = 'admin-ui/index';
    static editorParentTemplatePath = '/admin-ui/layouts/base';
    static editorTemplatePath = 'admin-ui/edit';
    static listParentTemplatePath = '/admin-ui/layouts/base';
    static listTemplatePath = 'admin-ui/list';
    static nestedParentTemplatePath = '/admin-ui/layouts/nested-base';
    static nestedTemplatePath = 'admin-ui/nested';
    static popupEditorParentTemplatePath = '/admin-ui/layouts/nested-base';
    static popupEditorTemplatePath = 'admin-ui/edit-popup';
    static canReadFunction = (req: Request, entityName: String) => true;
    static canWriteFunction = (req: Request, entityName: String) => true;
    static permissionDeniedHandler = (req: Request, res: Response, entityName: String) => {
      res.redirect('/AdminUI');
    };

    constructor() {
        super();
        AdminUIModule.configuration[AdminType.Id] = '/admin-ui/editors/id';
        AdminUIModule.configuration[AdminType.String] =
            '/admin-ui/editors/string';
        AdminUIModule.configuration[AdminType.Text] = '/admin-ui/editors/text';
        AdminUIModule.configuration[AdminType.Selection] =
            '/admin-ui/editors/selection';
        AdminUIModule.configuration[AdminType.RichText] =
            '/admin-ui/editors/rich-text';
        AdminUIModule.configuration[AdminType.Checkbox] =
            '/admin-ui/editors/checkbox';
        AdminUIModule.configuration[AdminType.Radio] =
            '/admin-ui/editors/radio';
        AdminUIModule.configuration[AdminType.Number] =
            '/admin-ui/editors/number';
        AdminUIModule.configuration[AdminType.Date] = '/admin-ui/editors/date';
        AdminUIModule.configuration[AdminType.Table] =
            '/admin-ui/editors/table';
        AdminUIModule.configuration[AdminType.Expanded] =
            '/admin-ui/editors/expanded';
        AdminUIModule.configuration[AdminType.Time] = '/admin-ui/editors/time';
        AdminUIModule.configuration[AdminType.Color] =
            '/admin-ui/editors/color';
        AdminUIModule.configuration[AdminType.Media] =
            '/admin-ui/editors/media';
        AdminUIModule.configuration[AdminType.AjaxSelection] =
            '/admin-ui/editors/ajax-selection';
        AdminUIModule.configuration[AdminType.DateTime] =
            '/admin-ui/editors/date-time';
        AdminUIModule.configuration[AdminType.ActionButton] =
            '/admin-ui/editors/action-button';
        AdminUIModule.configuration[AdminType.Currency] =
            '/admin-ui/editors/currency';

        setTimeout(() => {
            app.nunjucksEnvironment.addFilter(
                '_adminUIMasterFilter_',
                (str: any, filterName: string) => {
                    return app.nunjucksEnvironment.getFilter(filterName)(str);
                }
            );
        }, 2000);
    }

    /**
     * Set a new template path for the specified type.
     * @param type The type of widget
     * @param templatePath The view path of the editor
     */
    static setEditor(type: AdminType, templatePath: string) {
        AdminUIModule.configuration[type] = templatePath;
    }

    /**
     * Customize the index template
     * @param path the index template path
     */
    static setIndexTemplatePath(path: string) {
        AdminUIModule.indexTemplatePath = path;
    }

    /**
     * Customize the editor template
     * @param path the editor template path
     */
    static setEditorTemplatePath(path: string) {
        AdminUIModule.editorTemplatePath = path;
    }

    /**
     * Customize the list template
     * @param path the list template path
     */
    static setListTemplatePath(path: string) {
        AdminUIModule.listTemplatePath = path;
    }

    /**
     * Customize the nested template
     * @param path the nested template path
     */
    static setNestedTemplatePath(path: string) {
        AdminUIModule.nestedTemplatePath = path;
    }

    /**
     * Customize the popup editor template
     * @param path the popup editor template path
     */
    static setEditorPopupTemplatePath(path: string) {
        AdminUIModule.popupEditorTemplatePath = path;
    }

    /**
     * Customize the index template
     * @param path the index father template path
     */
    static setIndexParentTemplatePath(path: string) {
        AdminUIModule.indexParentTemplatePath = path;
    }

    /**
     * Customize the editor template
     * @param path the editor father template path
     */
    static setEditorParentTemplatePath(path: string) {
        AdminUIModule.editorParentTemplatePath = path;
    }

    /**
     * Customize the list template
     * @param path the list father template path
     */
    static setListParentTemplatePath(path: string) {
        AdminUIModule.listParentTemplatePath = path;
    }

    /**
     * Customize the nested template
     * @param path the nested father template path
     */
    static setNestedParentTemplatePath(path: string) {
        AdminUIModule.nestedParentTemplatePath = path;
    }

    /**
     * Customize the popup editor father template
     * @param path the popup editor father template path
     */
    static setEditorPopupParentTemplatePath(path: string) {
        AdminUIModule.popupEditorParentTemplatePath = path;
    }

    /**
     * Customize to protect routes and frontend
     * @param func the function that contains the access logic
     */
    static setCanReadFunction(
        func: (req: Request, entity: String) => boolean
    ) {
        AdminUIModule.canReadFunction = func;
    }

    /**
     * Customize to protect routes and frontend
     * @param func the function that contains the access logic
     */
    static setCanWriteFunction(
        func: (req: Request, entityName: String) => boolean
    ) {
        AdminUIModule.canWriteFunction = func;
    }

    /**
     * Customize the response when access permission is denied (based on canRead/Write methods)
     * @param func the function that contains the permission denied logc
     */
    static setPermissionDeniedHandler(
        func: (req: Request, res: Response, entityName: string) => void
    ) {
        AdminUIModule.permissionDeniedHandler = func;
    }

    get translation(): string {
        return __dirname + '/locale';
    }

    get controllers(): string {
        return __dirname + '/controllers';
    }

    get views(): string {
        return __dirname + '/views';
    }

    get public(): string {
        return __dirname + '/public';
    }

    get templating(): string {
        return __dirname + '/templating';
    }

    get middlewares(): string {
        return __dirname + '/middlewares';    
    }
}
