import BaseEntity from 'lynx-framework/entities/base.entity';
import Request from 'lynx-framework/request';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AdminField, AdminType, AdminUI, QueryParams } from '../../decorators';
import EditableEntity from '../../editable-entity';
import Therapy from './therapy.entity';

async function fetchTherapyList(
    req: Request,
    entity: Cat,
    params: QueryParams
) {
    return await Therapy.findAndCount({
        where: {
            cat: entity,
        },
        take: params.take,
        skip: params.skip,
        order: params.order,
    });
}

@AdminUI('Cats', {
    uiSettings: {
        smartSearchableHint: 'Cerca per nome',
    },
})
@Entity('cats')
export default class Cat extends BaseEntity implements EditableEntity {
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        hide: true,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @AdminField({
        name: 'Name',
        type: AdminType.String,
        onSummary: true,
        hide: true,
        smartSearchable: true,
    })
    @Column()
    name: string;

    @AdminField({
        name: 'Terapie',
        type: AdminType.Table,
        selfType: 'Therapy',
        inverseSide: 'cat',
        query: fetchTherapyList,
        hide: async (req: Request, _: any) => {
            if (req.originalUrl.indexOf('ajaxDetails') >= 0) {
                return true;
            }
            return false;
        },
        uiSettings: {
            tab: 'therapies',
            editorClasses: 'col-12',
            expandedEditorClasses: 'd-none',
            noDataTemplate: '/no-data-nested',
        },
    })
    @OneToMany(() => Therapy, (therapy) => therapy.cat)
    therapies: Therapy[];

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }
}
