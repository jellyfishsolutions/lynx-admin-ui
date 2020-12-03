import Request from 'lynx-framework/request';

export default interface EditableEntity {
    /**
     * return the id of the entity
     */
    getId(): any;
    /**
     * return a readable label of the entity
     */
    getLabel(): string;

    /**
     * this method (if implemented) will be executeded just BEFORE the saving action of an entity.
     * The entity is already updated with the latest value inserted by the user.
     * If an expection is throwed in this method, the saving process will be interrupted.
     */
    onBeforeSave?(req: Request): Promise<void>;

    /**
     * this method (if implemented) will be executeded just AFTER the saving action of an entity.
     */
    onAfterSave?(req: Request): Promise<void>;
}

export function map(values: EditableEntity[]): { key: any; value: string }[] {
    return values.map((element: EditableEntity) => {
        return {
            key: element.getId(),
            value: element.getLabel(),
        };
    });
}

export async function notEditableFromPopup(
    req: Request,
    _: any
): Promise<boolean> {
    if (req.method == 'POST') {
        return false;
    }
    return req.query.popup != null;
}
