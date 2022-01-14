import BaseFunction from "lynx-framework/templating/base.function";
import { TemplateFunction } from "lynx-framework/templating/decorators";
import AdminUIModule from '..';

@TemplateFunction("AUIcanRead")
export class CanReadFunction extends BaseFunction {
    execute(...args: any[]) {
        return AdminUIModule.canReadFunction(args[0], args[1]);
    }
}