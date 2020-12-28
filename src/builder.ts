import { Controller } from './controller';
import { ClassParameters, EntityMetadata, FieldParameters } from './decorators';

export default class Builder {
    name: string;
    classParameters: ClassParameters = {};
    fields: Record<string, FieldParameters> = {};
    constructor(name: string, classParameter: ClassParameters) {
        this.name = name;
        this.classParameters = classParameter;

        if (!this.classParameters || !this.classParameters.customRepository) {
            throw new Error(
                'AdminUI: Please specify the ClassParameters and the "customRepository" function.'
            );
        }
    }

    addField(key: string, params: FieldParameters): Builder {
        if (!params) {
            throw new Error('AdminUI: Please specify the FieldParameters');
        }
        if (!params.selfType) {
            throw new Error('AdminUI: Please specify the "selfType"');
        }
        if (this.fields[key]) {
            throw new Error(
                'AdminUI: The ' + key + ' field has already been specified'
            );
        }
        this.fields[key] = params;

        return this;
    }

    build(): EntityMetadata {
        let e = new EntityMetadata();
        e.name = this.name;
        e.fields = this.fields;
        e.classParameters = this.classParameters;
        return e;
    }

    register() {
        let e = this.build();
        Controller.dynamicRegisterClass(e);
    }
}
