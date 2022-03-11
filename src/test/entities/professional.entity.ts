import BaseEntity from "lynx-framework/entities/base.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { AdminUI, AdminField, AdminType, QueryParams } from "../../decorators";
import ServiceInfoEntity from "./service-info.entity";
import EditableEntity, { map } from "../../editable-entity";
import Post from "./post.entity";
import Address from "./address.entity";
import { Request } from 'lynx-framework/request';

async function findMyServiceInfo() {
    return map(await ServiceInfoEntity.find());
}

async function fetchAddresses(
    req: Request,
    entity: Address,
    params: QueryParams
): Promise<[any[], number]> {
    if (!entity.id) {
        return [[], 0];
    }
    return await Address.findAndCount({
        where: {
            professional: entity,
        },
        take: params.take,
        skip: params.skip,
        order: params.order,
    });
}



@Entity("professionals")
@AdminUI("Professionisti", { relations: ['post', 'address'] })
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

    @AdminField({name: 'Post', selfType: 'Post', type: AdminType.Selection, onSummary: true, values: async () => map(await Post.find())})
    @ManyToOne(type => Post, _ => null, {eager: false})
    @JoinColumn()
    post: Post;



    @AdminField({
        name: 'Address',
        type: AdminType.Table,
        selfType: 'Address',
        inverseSide: 'professional',
        query: fetchAddresses,
        readOnly: false,
    })
    @OneToMany(() => Address, (address) => address.professional, { eager: true })
    address: Address[];

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }

}