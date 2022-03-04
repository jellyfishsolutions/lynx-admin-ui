import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from 'lynx-framework/entities/base.entity';
import EditableEntity, { map } from '../../editable-entity';
import Address from './address.entity';
import { Request } from 'lynx-framework/request';

export async function _myOnly(req: Request, e: any) {
    console.log('intanto è chiamata?');
    return true;
}

async function filteredAddresses(
    req: Request,
    currentEntity: any,
    search: string,
    page: number
): Promise<[{ key: any; value: string }[], boolean]> {
    let skip = 10 * (page - 1);
    let take = 10;
    let qb = Address.createQueryBuilder('q');
    if (search && search.length > 0) {
        qb = qb.where('q.street LIKE :l OR q.city LIKE :l', {
            l: '%' + search + '%',
        });
    }
    let searched = map(await qb.skip(skip).take(take).getMany());
    return [searched, searched.length > 0];
}

@Entity('customers')
@AdminUI('Customer')
export default class Customer extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    id: number;

    @Column()
    @AdminField({ name: 'Name', type: AdminType.String, onSummary: true })
    name: string;

    @OneToOne((type) => Address, { eager: true })
    @JoinColumn()
    @AdminField({
        name: 'Billing Address',
        type: AdminType.Expanded,
        selfType: 'Address',
        optionalParameters: {
            fieldset: false,
        },
    })
    billingAddress: Address;

    @OneToOne((type) => Address, { eager: true })
    @JoinColumn()
    @AdminField({
        name: 'Shipping Address',
        type: AdminType.Expanded,
        selfType: 'Address',
        readOnly: _myOnly,
        optionalParameters: {
            fieldset: true,
        },
    })
    shippingAddress: Address;

    @OneToOne((type) => Address, { eager: true })
    @JoinColumn()
    @AdminField({
        name: 'Shipping Address',
        type: AdminType.ExpandedAndSelection,
        searchRequest: filteredAddresses,
        selfType: 'Address',
        optionalParameters: {
            fieldset: true,
            readOnlyExpanded: true,
        },
    })
    preferredAddress: Address;

    @Column()
    @AdminField({ name: 'Note', type: AdminType.String })
    notes: string;

    getId() {
        return this.id;
    }

    getLabel(): string {
        return this.name;
    }
}
