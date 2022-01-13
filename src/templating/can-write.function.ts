import BaseFunction from "lynx-framework/templating/base.function";
import { TemplateFunction } from "lynx-framework/templating/decorators";
import AdminUIModule from '..';

@TemplateFunction("AUIcanWrite")
export class CanWriteFunction extends BaseFunction {
    execute(...args: any[]) {
        return AdminUIModule.canWriteFunction(args[0], args[1]);
    }
}