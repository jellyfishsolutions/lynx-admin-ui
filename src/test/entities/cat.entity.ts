import BaseEntity from 'lynx-framework/entities/base.entity';
import Request from 'lynx-framework/request';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    SaveOptions,
} from 'typeorm';
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
        tabs: [{ key: 'main', label: 'Main' }],
        defaultTab: 'main',
        tabsAsSections: true,
    },
})
@Entity('cats')
export default class Cat extends BaseEntity implements EditableEntity {
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        hide: true,
        uiSettings: {
            tab: 'main',
        },
    })
    @PrimaryGeneratedColumn()
    id: number;

    @AdminField({
        name: 'Name',
        type: AdminType.String,
        onSummary: true,
        hide: false,
        smartSearchable: true,
        defaultValue: async () => {
            console.log('generating name');
            return 'ASD';
        },
        uiSettings: {
            tab: 'main',
        },
    })
    @Column()
    name: string;

    @AdminField({
        name: 'Data nascita',
        type: AdminType.Date,
        onSummary: true,
        smartSearchable: true,
        uiSettings: {
            tab: 'main',
        },
    })
    @Column({ type: 'date', nullable: true, default: null })
    birthday?: Date;

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
            tab: 'main',
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

    save(options?: SaveOptions): Promise<this> {
        if (!this.name || this.name.length < 3) {
            throw new Error('Name is too short');
        }
        return super.save(options);
    }
}
