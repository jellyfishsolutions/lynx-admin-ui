import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from "lynx-framework/entities/base.entity";
import Customer from "./customer.entity";
import EditableEntity from "../../editable-entity";

@Entity("addresses")
@AdminUI("Address")
export default class Address extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true, onSummary: true })
    id: number;

    @Column()   
    @AdminField({ name: "Street", type: AdminType.String, onSummary: true })
    street: string;

    @Column()
    @AdminField({ name: "Street", type: AdminType.String, onSummary: true })
    city: string;

    @OneToOne(type => Customer)
    customer: Customer

    getId() {
        return this.id;
    }

    getLabel(): string {
        return this.street + " " + this.city;
    }

}