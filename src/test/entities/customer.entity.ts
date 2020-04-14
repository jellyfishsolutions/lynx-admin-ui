import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity from "../../editable-entity";
import Address from "./address.entity";

@Entity("customers")
@AdminUI("Customer")
export default class Customer extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true, onSummary: true })
    id: number;

    @Column()
    @AdminField({name: "Name", type: AdminType.String, onSummary: true })
    name: string;

    @OneToOne(type => Address, { eager: true })
    @JoinColumn()
    @AdminField({name: "Billing Address", type: AdminType.Expanded, selfType: 'Address' })
    billingAddress: Address;

    @OneToOne(type => Address, { eager: true })
    @JoinColumn()
    @AdminField({name: "Shipping Address", type: AdminType.Expanded, selfType: 'Address' })
    shippingAddress: Address;


    @Column()
    @AdminField({name: "Note", type: AdminType.String })
    notes: string;

    getId() {
        return this.id;
    }

    getLabel(): string {
        return this.name;
    }

}