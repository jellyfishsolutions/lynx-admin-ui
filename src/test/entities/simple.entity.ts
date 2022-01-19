import { AdminField, AdminType, AdminUI } from '../../decorators';
import EditableEntity, { map, notEditableFromPopup } from '../../editable-entity';
import BaseEntity from 'lynx-framework/entities/base.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import Complex from './complex.entity';
import Request from 'lynx-framework/request';

async function fetchData(req: Request, order: any, take: any, skip: any): Promise<[any[], number]>
{
  const query = req.query;
  const smartSearch = query?.smartSearch;
  const queryBuilder =  Simple.createQueryBuilder('simple_entity')
    .leftJoinAndSelect('simple_entity.complex', 'complex');

  if (smartSearch) {
    queryBuilder
      .where('simple_entity.time like :smartSearch')
      .orWhere('complex.name like :smartSearch')
      .setParameter('smartSearch', `%${smartSearch}%`);
  }

  for (let field in order) {
    const dir = order[field];
    if (field === 'complex') {
      field = 'complex.name';
    } else {
      field = `simple_entity.${field}`;
    }

    queryBuilder.addOrderBy(field, dir);
  }

  return queryBuilder
  .skip(skip)
  .take(take)
  .getManyAndCount();
}


@Entity('simple_entity')
@AdminUI('Simple', {
  relations: ['complex'],
  customFetchData: fetchData,
})
export default class Simple extends BaseEntity implements EditableEntity
{
  @AdminField({
    name: 'Id',
    type: AdminType.Id,
    readOnly: true,
    onSummary: false,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @AdminField({
    name: 'Ora',
    type: AdminType.Time,
    onSummary: true,
    smartSearchable: true,
  })
  @Column()
  time: string

  @AdminField({
    name: 'Complex',
    type: AdminType.Selection,
    selfType: 'Complex',
    inverseSide: 'simple',
    values: async () => map(await Complex.find()),
    onSummary: true,
    readOnly: notEditableFromPopup,
  })
  @ManyToOne(() => Complex, complex => complex.simple)
  complex: Complex;

  getId()
  {
    return this.id;
  }

  getLabel(): string
  {
    return this.time;
  }
}