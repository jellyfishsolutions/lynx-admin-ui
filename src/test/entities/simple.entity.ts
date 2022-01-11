import { AdminField, AdminType, AdminUI } from '../../decorators';
import EditableEntity, { map } from '../../editable-entity';
import BaseEntity from 'lynx-framework/entities/base.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import Complex from './complex.entity';


@Entity('simple_entity')
@AdminUI('Simple', {
  relations: ['complex']
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
  })
  @Column()
  time: string

  @AdminField({
    name: 'Complex',
    type: AdminType.Selection,
    selfType: 'Complex',
    inverseSide: 'simple',
    values: async () => map(await Complex.find()),
    hide: true,
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