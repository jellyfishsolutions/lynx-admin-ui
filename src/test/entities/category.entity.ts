import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from 'lynx-framework/entities/base.entity';
import EditableEntity from '../../editable-entity';

@Entity('categories')
@AdminUI('Category')
export default class Category extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    id: number;

    @Column()
    @AdminField({
        name: 'Name',
        type: AdminType.String,
        onSummary: true,
        searchable: true,
    })
    name: string;

    @Column({ nullable: true })
    @AdminField({
        name: 'Date',
        type: AdminType.Date,
        readOnly: false,
        onSummary: true,
        uiSettings: {
            listFilter: 'date',
        },
    })
    date: Date;

    @Column({ nullable: true })
    @AdminField({
      name: 'Sensible Content',
      type: AdminType.Checkbox,
      readOnly: true,
      onSummary: true,
    })
    sensible: boolean;

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }
}
