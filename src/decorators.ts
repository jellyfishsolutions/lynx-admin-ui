import { Request } from 'lynx-framework/request';
import BaseEntity from 'lynx-framework/entities/base.entity';

export enum AdminType {
    Id = 1,
    String = 2,
    Text = 3,
    Selection = 4,
    RichText = 5,
    Checkbox = 6,
    Radio = 7,
    Number = 8,
    Date = 9,
    Table = 10,
    Expanded = 11,
    Time = 12,
    Color = 13,
    Media = 14,
    AjaxSelection = 15,
    DateTime = 16,
    ActionButton = 17,
    Currency = 18,
    ExpandedAndSelection = 19,
}

export interface UISettings {
    editorClasses?: string;
    innerEditorClasses?: string;
    expandedEditorClasses?: string;
    filterClasses?: string;
    listTemplate?: string;
    listFilter?: string;
    additionalEditorInfo?: any;
    additionalFilterInfo?: any;
    additionalListInfo?: any;
    descriptionText?: string;
    descriptionTextClasses?: string;
    editorFullWidth?: boolean;
    tab?: string;
    onRightColumn?: boolean;
    //TODO: editorOrder?: number;
    //TODO: editorFilter?: number;
    //TODO: editorList?: number;
}

export interface EntityUISettings {
    tabs?:  { key: string; label: string }[];
    hasTabsInExpanded?: boolean;
    hasTabsInModal?: boolean;
    defaultTab?: string;
    hasRightColumn?: boolean;
}

export interface ClassParameters {
    filterBy?: (req: Request) => Promise<any>;
    editorTemplate?: string | ((req: Request) => Promise<string>);
    editorParentTemplate?: string | ((req: Request) => Promise<string>);
    popupEditorTemplate?: string | ((req: Request) => Promise<string>);
    popupEditorParentTemplate?: string | ((req: Request) => Promise<string>);
    listTemplate?: string | ((req: Request) => Promise<string>);
    listParentTemplate?: string | ((req: Request) => Promise<string>);
    listActionTemplate?: string | ((req: Request) => Promise<string>);
    batchDelete?: boolean | ((req: Request) => Promise<boolean>);
    relations?: string[];
    disableCreation?: boolean | ((req: Request) => Promise<boolean>);
    disableDelete?: boolean | ((req: Request) => Promise<boolean>);
    defaultOrderBy?: string | ((req: Request) => Promise<string>);
    uiSettings?: EntityUISettings
    
    customFetchData?: (
        req: Request,
        order: any,
        take: number,
        skip: number
    ) => Promise<[any[], number]>;
    disableReloadOnList?: boolean | ((req: Request) => Promise<boolean>);
}

export interface QueryParams {
    order: any;
    take: number;
    skip: number;
}

export interface OptionalParameters {}

export interface ExpandedAndSelectionParameters extends OptionalParameters {
    readOnlyExpanded?: boolean;
}

export interface FieldParameters {
    name: string;
    type: AdminType;
    readOnly?:
        | boolean
        | ((req: Request, currentEntity: any) => Promise<boolean>);
    hide?: boolean | ((req: Request, currentEntity: any) => Promise<boolean>);
    values?:
        | { key: any; value: string }[]
        | ((
              req: Request,
              currentEntity: any
          ) => Promise<{ key: any; value: string }[]>);
    query?: (
        req: Request,
        currentEntity: any,
        params: QueryParams
    ) => Promise<[BaseEntity[], number]>;
    searchRequest?: (
        req: Request,
        currentEntity: any,
        search: string,
        page: number
    ) => Promise<[{ key: any; value: string }[], boolean]>;
    required?:
        | boolean
        | ((req: Request, currentEntity: any) => Promise<boolean>);
    pattern?: string;
    accept?: string;
    min?: number | string;
    max?: number | string;
    step?: number;
    hundredsSeparator?:
        | string
        | ((req: Request, currentEntity: any) => Promise<string>);
    decimalSeparator?:
        | string
        | ((req: Request, currentEntity: any) => Promise<string>);
    digits?: number;
    onSummary?: boolean;
    searchable?: boolean;
    smartSearchable?: boolean;
    selfType?: string;
    inverseSide?: string;
    uiSettings?: UISettings;
    optionalParameters?: OptionalParameters;
    getter?: (value: any) => Promise<string>;
}

export class EntityMetadata {
    name: string;
    classParameters: ClassParameters = {};
    fields: Record<string, FieldParameters> = {};
}

let currentEntity: EntityMetadata = new EntityMetadata();

export function AdminUI(name: string, params?: ClassParameters) {
    return (target: any) => {
        currentEntity.name = name;
        if (params) {
            currentEntity.classParameters = params;
        }
        target.adminUI = currentEntity;
        currentEntity = new EntityMetadata();
    };
}

export function AdminField(params: FieldParameters) {
    return (target: any, key: string) => {
        var type = Reflect.getMetadata('design:type', target, key);
        if (!params.selfType) {
            if (!type) {
                throw new Error(
                    "AdminUI: Unable to understand the current type. Please add the 'selfType' parameter for the '" +
                        key +
                        "' field."
                );
            }
            if (type.name == 'Promise') {
                throw new Error(
                    "AdminUI: Please specify the Promise type for the '" +
                        key +
                        "' field."
                );
            }
            if (type.name == 'Array') {
                throw new Error(
                    "AdminUI: Please specify the Arrays type for the '" +
                        key +
                        "' field."
                );
            }
            params.selfType = type.name;
        }
        currentEntity.fields[key] = params;
    };
}
