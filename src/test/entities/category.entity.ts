import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity from "../../editable-entity";


@Entity("categories")
@AdminUI("Category")
export default class Category extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true, onSummary: true })
    id: number;

    @Column()
    @AdminField({ name: "Name", type: AdminType.String, onSummary: true, searchable: true })
    name: string;

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }

}

