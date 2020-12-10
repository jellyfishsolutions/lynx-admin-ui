import BaseEntity from 'lynx-framework/entities/base.entity';
import EditableEntity, {
    notEditableFromPopup,
    map,
} from '../../editable-entity';

import { PrimaryGeneratedColumn, Column, Entity, ManyToOne } from 'typeorm';
import { AdminUI, AdminField, AdminType } from '../../decorators';
import ContractEntity from './contract.entity';

@AdminUI('Prezzi')
@Entity('prices')
export default class PriceEntity extends BaseEntity implements EditableEntity {
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @AdminField({
        name: 'Prezzo',
        type: AdminType.Currency,
        onSummary: true,
    })
    @Column({ type: 'decimal', precision: 2 })
    price: number;

    @AdminField({
        name: 'Prezzo',
        type: AdminType.String,
        onSummary: true,
    })
    @Column()
    test: string;

    @ManyToOne((type) => ContractEntity, (contract) => contract.prices, {
        eager: true,
    })
    @AdminField({
        name: 'Contratto',
        type: AdminType.Selection,
        selfType: 'ContractEntity',
        readOnly: notEditableFromPopup,
        values: async () => map(await ContractEntity.find()),
    })
    contract: ContractEntity;

    getId() {
        return this.id;
    }
    getLabel(): string {
        if (!this.price) {
            return 'Not set';
        }
        try {
            return this.price.toFixed(2);
        } catch (e) {
            return '' + this.price;
        }
    }
}
