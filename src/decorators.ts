import { Request } from "lynx-framework/request";

export enum AdminType {
    Id = 1,
    String = 2,
    Text = 3,
    Selection = 4,
    RichText = 5,
    Checkbox = 6,
    Radio = 7
    //Number
    //Date
    //Time
    //DateTime
}

export interface UISettings {
    editorClasses?: string;
    filterClasses?: string;
    listTemplate?: string;
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
    onSummary?: boolean;
    searchable?: boolean;
    selfType?: any;
    uiSettings?: UISettings;
}

export class EntityMetadata {
    name: string;
    fields: Map<string, FieldParameters> = new Map<string, FieldParameters>();
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
            params.selfType = type;
        }
        currentEntity.fields.set(key, params);
    };
}
