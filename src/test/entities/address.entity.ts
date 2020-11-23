import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from "lynx-framework/entities/base.entity";
import Customer from "./customer.entity";
import EditableEntity from "../../editable-entity";
import Request from "lynx-framework/request";

@Entity("addresses")
@AdminUI("Address",{
    defaultOrderBy: '+city',
    batchDelete: true
})
export default class Address extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true, onSummary: true })
    id: number;

    @Column()   
    @AdminField({ name: "Street", type: AdminType.String, onSummary: true, smartSearchable: true, uiSettings: { additionalEditorInfo: {prova: 'asdasd'} } })
    street: string;

    @Column()
    @AdminField({ name: "Street", type: AdminType.String, onSummary: true, smartSearchable: true })
    city: string;

    @OneToOne(type => Customer)
    customer: Customer

    getId() {
        return this.id;
    }

    getLabel(): string {
        return this.street + " " + this.city;
    }


    async onBeforeSave(_: Request): Promise<void> {
        console.log('before saving '+this.street+' con id '+this.id);
        return;
    }

    async onAfterSave(_: Request): Promise<void> {
        console.log('after saving '+this.street+' con id '+this.id);
        return;
    }

}