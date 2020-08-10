import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity from "../../editable-entity";

import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from "typeorm";
import { AdminUI, AdminField, AdminType, QueryParams } from "../../decorators";
import PriceEntity from "./price.entity";
import Request from "lynx-framework/request";


async function fetchPrices(req: Request, contract: ContractEntity, params: QueryParams): Promise<[any[], number]> {
    return await PriceEntity.findAndCount({
        where: {
            contract: contract,
        },
        take: params.take,
        skip: params.skip,
        order: params.order,
    });
}

@AdminUI('Contratti')
@Entity('contracts')
export default class ContractEntity extends BaseEntity implements EditableEntity {

    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        onSummary: true
    })
    @PrimaryGeneratedColumn()
    id: number;

    @AdminField({
        name: 'Nome',
        type: AdminType.String,
        onSummary: true
    })
    @Column()
    name: string;

    @OneToMany((type) => PriceEntity, (price) => price.contract)
    @AdminField({ name: "Prezzi", type: AdminType.Table, selfType: "PriceEntity", query: fetchPrices, inverseSide: 'contract' })
    prices: PriceEntity[];

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }

}