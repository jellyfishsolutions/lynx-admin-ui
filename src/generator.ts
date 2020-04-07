import { EntityMetadata } from "./decorators";
import * as fs from "fs";


export function generateSchema(entitiesPaths: string[]): { entity: any; meta: EntityMetadata }[] {
    
    let data: { entity: any; meta: EntityMetadata }[] = [];

    for (let path of entitiesPaths) {
        if (path.endsWith("/*.entity.js")) {
            path = path.substring(0, path.length - "/*.entity.js".length);
        }
        if (!fs.existsSync(path)) {
            continue;
        }
        const files = fs.readdirSync(path);
        for (let index in files) {
            if (files[index].endsWith("ts")) continue;
            const entity = require(path + "/" + files[index]).default;
            if (!entity) {
                continue;
            }
            if (entity.adminUI) {
                data.push({ entity: entity, meta: entity.adminUI });
            }
        }
    }

    return data;
}