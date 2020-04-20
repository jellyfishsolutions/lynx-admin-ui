import { Request } from "lynx-framework/request";
import BaseEntity from "lynx-framework/entities/base.entity";

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
    Expanded = 11
    //Time
    //DateTime
}

export interface UISettings {
    editorClasses?: string;
    filterClasses?: string;
    listTemplate?: string;
    //TODO: editorOrder?: number;
    //TODO: editorFilter?: number;
    //TODO: editorList?: number;
}

export interface QueryParams {
    order: any;
    take: number;
    skip: number;
}

export interface FieldParameters {
    name: string;
    type: AdminType;
    readOnly?:
        | boolean
        | ((req: Request, currentEntity: any) => Promise<boolean>); //potrebbe essere una funzione che dipende dall'attuale req e dai valori stessi della entity.
    values?:
        | { key: any; value: string }[]
        | ((
              req: Request,
              currentEntity: any
          ) => Promise<{ key: any; value: string }[]>);
    query?: ((req: Request, currentEntity: any, params: QueryParams) => Promise<[BaseEntity[], number]>);
    pattern?: string;
    min?: number;
    max?: number;
    step?: number;
    onSummary?: boolean;
    searchable?: boolean;
    selfType?: string;
    inverseSide?: string;
    uiSettings?: UISettings;
}

export class EntityMetadata {
    name: string;
    fields: Record<string, FieldParameters> = {};
}

let currentEntity: EntityMetadata = new EntityMetadata();

export function AdminUI(name: string) {
    return (target: any) => {
        currentEntity.name = name;
        target.adminUI = currentEntity;
        currentEntity = new EntityMetadata();
    };
}

export function AdminField(params: FieldParameters) {
    return (target: any, key: string) => {
        var type = Reflect.getMetadata("design:type", target, key);
        if (!params.selfType) {
            if (!type) {
                throw new Error('AdminUI: Unable to understand the current type. Please add the \'selfType\' parameter for the \''+key+'\' field.');
            }
            params.selfType = type.name;
        }
        currentEntity.fields[key] = params;
    };
}
