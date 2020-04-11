import SimpleModule from "lynx-framework/simple.module";
import { AdminType } from "./decorators";

export default class AdminUIModule extends SimpleModule {

    static configuration: any = {};
    static editorParentTemplatePath = '/admin-ui/layouts/base';
    static editorTemplatePath = 'admin-ui/edit';
    static listParentTemplatePath = '/admin-ui/layouts/base';
    static listTemplatePath = 'admin-ui/list';
    static nestedParentTemplatePath = '/admin-ui/layouts/base';
    static nestedTemplatePath = 'admin-ui/nested';
    static popupEditorParentTemplatePath = '/admin-ui/layouts/base';
    static popupEditorTemplatePath = 'admin-ui/edit-popup';

    constructor() {
        super();
        AdminUIModule.configuration[AdminType.Id] = '/admin-ui/editors/id';
        AdminUIModule.configuration[AdminType.String] = '/admin-ui/editors/string';
        AdminUIModule.configuration[AdminType.Text] = '/admin-ui/editors/text';
        AdminUIModule.configuration[AdminType.Selection] = '/admin-ui/editors/selection';
        AdminUIModule.configuration[AdminType.RichText] = '/admin-ui/editors/rich-text';
        AdminUIModule.configuration[AdminType.Checkbox] = '/admin-ui/editors/checkbox';
        AdminUIModule.configuration[AdminType.Radio] = '/admin-ui/editors/radio';
        AdminUIModule.configuration[AdminType.Number] = '/admin-ui/editors/number';
        AdminUIModule.configuration[AdminType.Date] = '/admin-ui/editors/date';
        AdminUIModule.configuration[AdminType.Table] = '/admin-ui/editors/table';
    }

    /**
     * Set a new template path for the specified type.
     * @param type The type of widget
     * @param templatePath The view path of the editor
     */
    setEditor(type: AdminType, templatePath: string) {
        AdminUIModule.configuration[type] = templatePath;
    }

    /**
     * Customize the editor template
     * @param path the editor template path
     */
    setEditorTemplatePath(path: string) {
        AdminUIModule.editorTemplatePath = path;
    }

    /**
     * Customize the list template
     * @param path the list template path
     */
    setListTemplatePath(path: string) {
        AdminUIModule.listTemplatePath = path;
    }

    /**
     * Customize the nested template
     * @param path the nested template path
     */
    setNestedTemplatePath(path: string) {
        AdminUIModule.nestedTemplatePath = path;
    }

    /**
     * Customize the popup editor template
     * @param path the popup editor template path
     */
    setEditorPopupTemplatePath(path: string) {
        AdminUIModule.popupEditorTemplatePath = path;
    }




    get controllers(): string {
        return __dirname + "/controllers";
    }

    get views(): string {
        return __dirname + "/views";
    }

    get public(): string {
        return __dirname + "/public";
    }
}
