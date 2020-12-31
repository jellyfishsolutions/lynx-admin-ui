import { IRepository } from '.';
import { EntityMetadata } from './decorators';
import { generateSchema } from './generator';
import { app } from 'lynx-framework/app';
import BaseEntity from 'lynx-framework/entities/base.entity';

/**
 * This class contains all the information on the currently registered AdminUI classes.
 */
export class AdminUIRepository {
    private static _adminUI: { entity: IRepository; meta: EntityMetadata }[];
    private static hasInit = false;

    /**
     * Initialize the AdminUI repository.
     * This method will be automatically called when at least a page of the AdminUI interface is requested.
     * It can be safely called multiple times.
     */
    static init(): void {
        if (!AdminUIRepository.hasInit) {
            AdminUIRepository.hasInit = true;
            AdminUIRepository._adminUI = generateSchema(app.config.db.entities);
        }
    }

    /**
     * dynamic register a new class
     * @param entityMetadata the metadata describing the class
     */
    static dynamicRegisterClass(entityMetadata: EntityMetadata) {
        AdminUIRepository.init();
        let repository = entityMetadata.classParameters!.customRepository!();
        let index = -1;
        for (let i = 0; i < AdminUIRepository._adminUI.length; i++) {
            let c = AdminUIRepository._adminUI[i];
            if (c.entity && c.entity.name == repository.name) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            AdminUIRepository._adminUI.splice(index, 1);
        }
        AdminUIRepository._adminUI.push({
            entity: repository,
            meta: entityMetadata,
        });
    }

    /**
     * retrieve the repository of an entity from its name.
     * It returns null if the entity is nof found.
     * @param entityKey the name of the entity (not its visualized name, but its actual name)
     */
    static getRepositoryForEntity(entityKey: string): IRepository {
        for (let k of AdminUIRepository._adminUI) {
            if (k.entity.name == entityKey) {
                return k.entity;
            }
        }
        return null as any;
    }

    /**
     * retrieve the metadata of an entity from its name.
     * It returns null if the entity is nof found.
     * @param entityName the name of the entity (not its visualized name, but its actual name)
     */
    static getMetadataForEntity(entityName: string): EntityMetadata {
        for (let d of AdminUIRepository._adminUI) {
            if (d.entity.name == entityName) {
                return d.meta;
            }
        }
        return null as any;
    }

    /**
     * retrieve the list of currently registered entities
     */
    static entitiesList(): { name: string; readableName: string }[] {
        let list = [];
        for (let d of AdminUIRepository._adminUI) {
            list.push({
                name: d.entity.name,
                readableName: d.meta.name,
            });
        }
        return list;
    }

    /**
     * retrieve the entity instance with the chosen id
     * @param entityName the name of the entity
     * @param id  its id
     */
    static async retrieveEntity(
        entityName: string,
        id: any
    ): Promise<BaseEntity | null> {
        for (let d of AdminUIRepository._adminUI) {
            if (d.entity.name == entityName) {
                if (!id || id == '0') {
                    if (d.entity.factory !== undefined) {
                        return d.entity.factory() as any;
                    }
                    return new (d.entity as any)();
                }
                return await d.entity.findOne(id, {
                    relations: d.meta.classParameters.relations,
                });
            }
        }
        return null;
    }
}
