import BaseEntity from 'lynx-framework/entities/base.entity';
import EditableEntity from '../../editable-entity';
import { Entity, PrimaryColumn, Column } from 'typeorm';
import { AdminField, AdminType, AdminUI } from '../../decorators';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

function generate(): string {
    return '3d:12:84:a8:cc:84' + getRandomInt(9);
}

@AdminUI('Custom Id')
@Entity('custom-ids')
export default class CustomId extends BaseEntity implements EditableEntity {
    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }

    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    @PrimaryColumn()
    id: string = generate();

    @AdminField({
        name: 'Name',
        type: AdminType.String,
        onSummary: true,
    })
    @Column()
    name: string;
}
