import { EntityMetadata } from './decorators';
import * as fs from 'fs';
import AdminUIModule, { IRepository } from '.';
import { logger } from 'lynx-framework/logger';

function performLoad(
    entity: any,
    data: { entity: IRepository; meta: EntityMetadata }[]
) {
    if (!entity) {
        return;
    }
    if (entity.adminUI) {
        let ee;
        if (entity.adminUI.classParameters.customRepository) {
            ee = entity.adminUI.classParameters.customRepository();
        } else {
            ee = entity;
        }
        data.push({ entity: ee, meta: entity.adminUI });
    }
}

export function generateSchema(
    entitiesPaths: string[]
): { entity: IRepository; meta: EntityMetadata }[] {
    let data: { entity: IRepository; meta: EntityMetadata }[] = [];

    for (let path of entitiesPaths) {
        if (path.endsWith('/*.entity.js')) {
            path = path.substring(0, path.length - '/*.entity.js'.length);
        }
        if (!fs.existsSync(path)) {
            continue;
        }
        const files = fs.readdirSync(path);
        for (let index in files) {
            if (files[index].endsWith('ts')) continue;
            const entity = require(path + '/' + files[index]).default;
            performLoad(entity, data);
        }
    }

    for (let path of AdminUIModule._additionalClassesPath) {
        if (path.endsWith('ts')) {
            logger.error(
                'AdminUI: Trying loading a custom registered class, but found that is a Typescript file!'
            );
            throw Error('Loading Typescript file is not supported!');
        }
        const entity = require(path).default;
        if (!entity) {
            throw Error(
                'AdminUI: Please specify a "default" export in the file ' + path
            );
        }
        performLoad(entity, data);
    }

    return data;
}
