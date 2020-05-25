import BaseEntity from "lynx-framework/entities/base.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { AdminUI, AdminField, AdminType } from "../../decorators";
import ServiceInfoEntity from "./service-info.entity";
import EditableEntity, { map } from "../../editable-entity";
import Post from "./post.entity";


async function findMyServiceInfo() {
    return map(await ServiceInfoEntity.find());
}


@Entity("professionals")
@AdminUI("Professionisti", { relations: ['post'] })
export default class ProfessionalEntity extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: "Id",
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    id: number;

    @Column()
    @AdminField({
        name: "Nome",
        type: AdminType.Text,
        onSummary: true,
        searchable: true,
    })
    name: string;

    @AdminField({name: 'Servizio di consulenza', type: AdminType.Selection, onSummary: true, selfType: 'ServiceInfoEntity', values: findMyServiceInfo })
    @ManyToOne(type => ServiceInfoEntity, _ => null)
    @JoinColumn() 
    consultingService: Promise<ServiceInfoEntity>;

    @AdminField({name: 'Post', type: AdminType.Selection, onSummary: true, values: async () => map(await Post.find())})
    @ManyToOne(type => Post, _ => null, {eager: false})
    @JoinColumn()
    post: Post;

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }

}