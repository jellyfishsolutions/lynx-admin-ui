import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity
} from "typeorm";
import { AdminUI, AdminField, AdminType } from "../../decorators";
import EditableEntity from "../../editable-entity";

@Entity('service_info')
@AdminUI('Corsi')
export default class ServiceInfoEntity extends BaseEntity implements EditableEntity {

    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true })
    @PrimaryGeneratedColumn() 
    id: number;

    @AdminField({ name: "Durata in minuti", type: AdminType.Number, step: 1 })
    @Column() 
    duration: number;

    @AdminField({ name: "Numero massimo partecipanti", type: AdminType.Number, min: 1, step: 1 })
    @Column() 
    maxAttendees: number;


    @AdminField({ name: "Nome", type: AdminType.String, onSummary: true })
    @Column() name: string;

    @AdminField({ name: "Data inizio", type: AdminType.Date, onSummary: true })
    @Column({ nullable: true }) startDate: Date;

    @AdminField({ name: "Data fine", type: AdminType.Date, onSummary: true })
    @Column({ nullable: true }) endDate: Date;

    @AdminField({ name: "Descrizione", type: AdminType.RichText, onSummary: true })
    @Column({ type: "text" }) description: string;


    getId() { return this.id; }
    getLabel(): string { return this.name; }

}


