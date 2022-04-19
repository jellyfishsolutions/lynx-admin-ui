import BaseEntity from 'lynx-framework/entities/base.entity';
import { AdminField, AdminType, AdminUI } from '../../decorators';
import EditableEntity, {
    map,
    notEditableFromPopup,
} from '../../editable-entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import Cat from './cat.entity';
import Request from 'lynx-framework/request';

export async function filteredCat(
    req: Request,
    currentEntity: any,
    search: string,
    page: number
): Promise<[{ key: any; value: string }[], boolean]> {
    let skip = 10 * (page - 1);
    let take = 10;
    let qb = Cat.createQueryBuilder('q');
    if (search && search.length > 0) {
        qb = qb.where('q.name LIKE :l', {
            l: '%' + search + '%',
        });
    }
    let data = await qb.skip(skip).take(take).getMany();
    console.log('data', data);
    let searched = map(data);
    return [searched, searched.length > 0];
}

@AdminUI('Terapie')
@Entity('therapies')
export default class Therapy extends BaseEntity implements EditableEntity {
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @AdminField({
        name: 'Nome Medicina',
        type: AdminType.String,
        onSummary: true,
    })
    @Column()
    drug: string;

    @AdminField({
        name: 'Gatto',
        type: AdminType.ExpandedAndSelection,
        selfType: 'Cat',
        inverseSide: 'therapies',
        optionalParameters: {
            fieldset: false,
        },
        searchRequest: filteredCat,
        readOnly: notEditableFromPopup,
    })
    @ManyToOne(() => Cat, (cat) => cat.therapies, { eager: true })
    cat: Cat;

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.drug;
    }
}
