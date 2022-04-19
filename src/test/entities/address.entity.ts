import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from 'lynx-framework/entities/base.entity';
import Customer from './customer.entity';
import EditableEntity from '../../editable-entity';
import Request from 'lynx-framework/request';

async function _myOnly(req: Request, e: any) {
    return false;
}

@Entity('addresses')
@AdminUI('Address', {
    defaultOrderBy: '+city',
    batchDelete: true,
    uiSettings: {
        tabsAsSections: true,
        tabs: [
            {
                key: 'tab1',
                label: 'admin-ui.add',
            },
            {
                key: 'tab2',
                label: 'admin-ui.select',
            },
        ],
        defaultTab: 'tab1',
        hideTabsInExpanded: true,
        hasRightColumn: true,
    },
})
export default class Address extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: false,
        onSummary: true,
        uiSettings: {
            tab: 'tab1',
            editorClasses: 'col-12',
            expandedEditorClasses: 'col-4',
        },
    })
    id: number;

    @Column()
    @AdminField({
        name: 'Street',
        type: AdminType.String,
        onSummary: true,
        smartSearchable: true,
        uiSettings: {
            onRightColumn: true,
            tab: 'tab2',
            editorClasses: 'col-12',
            additionalEditorInfo: { prova: 'asdasd' },
            expandedEditorClasses: 'col-3',
        },
    })
    street: string;

    @Column()
    @AdminField({
        name: 'City',
        type: AdminType.String,
        onSummary: true,
        smartSearchable: true,
        readOnly: _myOnly,
        uiSettings: {
            tab: 'tab2',
            expandedEditorClasses: 'col-3',
        },
    })
    city: string;

    /*@AdminField({
        name: 'Professional',
        type: AdminType.Selection,
        selfType: 'ProfessionalEntity',
        inverseSide: 'address',
        values: async () => map(await ProfessionalEntity.find()),
        onSummary: true,
        readOnly: notEditableFromPopup,
      })
      @ManyToOne(() => ProfessionalEntity, professional => professional.address)
      professional: ProfessionalEntity;*/

    @OneToOne((type) => Customer)
    customer: Customer;

    getId() {
        return this.id;
    }

    getLabel(): string {
        return this.street + ' ' + this.city;
    }

    async onBeforeSave(_: Request): Promise<void> {
        console.log('before saving ' + this.street + ' con id ' + this.id);
        return;
    }

    async onAfterSave(_: Request): Promise<void> {
        console.log('after saving ' + this.street + ' con id ' + this.id);
        return;
    }
}
