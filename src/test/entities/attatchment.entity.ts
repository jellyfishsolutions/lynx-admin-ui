import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity from "../../editable-entity";
import { AdminField, AdminType, AdminUI } from "../../decorators";
import MediaEntity from "lynx-framework/entities/media.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";

@AdminUI('Allegati')
@Entity('attatchments')
export default class AttatchmentEntity extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true, onSummary: true })
    id: number;

    @Column()   
    @AdminField({ name: "Descrizione", type: AdminType.String, onSummary: true, smartSearchable: true, uiSettings: { additionalEditorInfo: {prova: 'asdasd'} } })
    description: string;

    
    @ManyToOne(type => MediaEntity, { eager: true })
    @JoinColumn()
    @AdminField({ name: 'File', type: AdminType.Media, onSummary: false})
    file: MediaEntity;

    


    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.description;
    }

}