import BaseFunction from "lynx-framework/templating/base.function";
import { TemplateFunction } from "lynx-framework/templating/decorators";


@TemplateFunction("AUIgenerateId")
export class GenerateId extends BaseFunction {
    execute(...args: any[]) {
        return Math.random().toString(36).substring(2, 9);
    }
}