export default interface EditableEntity {
    getId(): any;
    getLabel(): string;
}

export function map(values: EditableEntity[]): {key: any, value: string}[] {
    return values.map((element: EditableEntity) => {
        return {
            key: element.getId(),
            value: element.getLabel()
        }
    });
}
