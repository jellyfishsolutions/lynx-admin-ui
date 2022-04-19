import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';
import { AdminUI, AdminField, AdminType, QueryParams } from '../../decorators';
import BaseEntity from 'lynx-framework/entities/base.entity';
import Category from './category.entity';
import EditableEntity, { map } from '../../editable-entity';
import { Request } from 'lynx-framework/request';
import { app } from 'lynx-framework/app';
import Simple from './simple.entity';
import { defaultRichTextParameters } from '../../rich-text-options';

export enum Gender {
    male,
    female,
    other,
}

const genderValues = [
    { key: Gender.male, value: 'Maschio' },
    { key: Gender.female, value: 'Femmina' },
    { key: Gender.other, value: 'Altro' },
];

enum DayOfWeek {
    monday = 1,
    tuesday = 2,
    wednesday = 3,
    thursday = 4,
    friday = 5,
    saturday = 6,
    sunday = 7,
}

const days = [
    { key: DayOfWeek.monday, value: 'Lunedì' },
    { key: DayOfWeek.tuesday, value: 'Martedì' },
    { key: DayOfWeek.wednesday, value: 'Mercoledì' },
    { key: DayOfWeek.thursday, value: 'Giovedì' },
    { key: DayOfWeek.friday, value: 'Venerdì' },
    { key: DayOfWeek.saturday, value: 'Sabato' },
    { key: DayOfWeek.sunday, value: 'Domenica' },
];

async function getCategories() {
    return map(await Category.find());
}

async function fetchSimples(
    req: Request,
    entity: Complex,
    params: QueryParams
): Promise<[any[], number]> {
    if (!entity.id) {
        return [[], 0];
    }
    return await Simple.findAndCount({
        where: {
            complex: entity,
        },
        take: params.take,
        skip: params.skip,
        order: params.order,
    });
}

async function filteredCategories(
    req: Request,
    currentEntity: any,
    search: string,
    page: number
): Promise<[{ key: any; value: string }[], boolean]> {
    let skip = 10 * (page - 1);
    let take = 10;
    let qb = Category.createQueryBuilder('q');
    if (search && search.length > 0) {
        qb = qb.where('q.name LIKE :l', { l: '%' + search + '%' });
    }
    let searched = map(await qb.skip(skip).take(take).getMany());
    if (!search) {
        searched.unshift({
            key: 0,
            value: app.translate('admin-ui.select', req),
        });
    }
    return [searched, searched.length > 0];
}

async function isReadOnly(_: Request, entity: Complex): Promise<boolean> {
    if (entity.gender == Gender.male) {
        return true;
    }
    return false;
}

async function filteringList(req: Request): Promise<{}> {
    if (req.query.onlyFemale) {
        return {
            gender: Gender.female,
        };
    }
    return {};
}

async function listTemplate(req: Request): Promise<string> {
    if (req.query.onlyFemale) {
        return '/female-list';
    }
    return '';
}

async function actionTemplate(req: Request): Promise<string> {
    if (req.query.onlyFemale) {
        return '/female-list-action';
    }
    return '';
}

@Entity('complex')
@AdminUI('Complex Entity', {
    filterBy: filteringList,
    listParentTemplate: listTemplate,
    listActionTemplate: actionTemplate,
    disableReloadOnList: true,
    relations: ['subcategories', 'category', 'simple', 'categoryAjax'],
})
export default class Complex extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        //onSummary: true,
    })
    id: number;

    @Column()
    @AdminField({
        name: 'Name',
        type: AdminType.String,
        onSummary: true,
        smartSearchable: true,
        //searchable: true,
        uiSettings: {
            editorClasses: 'col-12',
            filterClasses: 'col-6',
            descriptionText: 'ah no?',
            descriptionTextClasses: 'text-primary',
        },
    })
    name: string;

    @Column()
    @AdminField({
        name: 'Surname',
        type: AdminType.String,
        onSummary: true,
        //searchable: true,
        uiSettings: { editorClasses: 'col-6', filterClasses: 'col-6' },
    })
    surname: string;

    @Column()
    @AdminField({
        name: 'Email',
        type: AdminType.String,
        pattern: '[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,}$',
    })
    email: string;

    @Column()
    @AdminField({
        name: 'Gender',
        type: AdminType.Selection,
        values: genderValues,
    })
    gender: Gender;

    @Column()
    @AdminField({
        name: 'Age',
        type: AdminType.Number,
        step: 1,
        min: 13,
    })
    age: number;

    @Column()
    @AdminField({
        name: 'Date of Birth',
        type: AdminType.Date,
    })
    dateOfBirth: Date;

    @Column({ nullable: true })
    @AdminField({
        name: 'Date and Time',
        type: AdminType.DateTime,
    })
    date: Date;

    @Column()
    @AdminField({
        name: 'Bio',
        type: AdminType.RichText,
        readOnly: isReadOnly,
        uiSettings: {
            editorFullWidth: true,
        },
        optionalParameters: defaultRichTextParameters,
    })
    biography: string;

    @Column()
    @AdminField({ name: 'Bio2', type: AdminType.RichText })
    biography2: string;

    @Column()
    @AdminField({ name: 'Privacy accettata', type: AdminType.Checkbox })
    privacy: boolean;

    @Column()
    @AdminField({
        name: 'Poteri',
        type: AdminType.Radio,
        values: [
            { key: 1, value: 'Super' },
            { key: 2, value: 'Normale' },
        ],
    })
    power: number;

    @ManyToOne((type) => Category, { eager: true })
    @AdminField({
        name: 'Categoria',
        type: AdminType.Selection,
        values: getCategories,
        onSummary: true,
        searchable: true,
        readOnly: true,
    })
    category: Category;

    @ManyToOne((type) => Category, { eager: true })
    @AdminField({
        name: 'Categoria con filtro ajax',
        type: AdminType.AjaxSelection,
        searchRequest: filteredCategories,
        onSummary: true,
    })
    categoryAjax: Category;

    @ManyToMany((type) => Category, { eager: true })
    @JoinTable()
    @AdminField({
        name: 'Altre categorie',
        type: AdminType.Checkbox,
        values: getCategories,
        selfType: 'Category',
        onSummary: true,
        searchable: true,
        readOnly: true,
        uiSettings: {
            listTemplate: '/chips',
        },
    })
    subcategories: Category[];

    @AdminField({
        name: 'Simple',
        type: AdminType.Table,
        selfType: 'Simple',
        inverseSide: 'complex',
        query: fetchSimples,
        readOnly: false,
        uiSettings: {
            actionListTemplate: '/simple-actions',
        },
    })
    @OneToMany(() => Simple, (simple) => simple.complex, { eager: true })
    simple: Simple[];

    @AdminField({
        name: 'Altre categorie ancora',
        type: AdminType.Checkbox,
        values: map([new Category()]),
        readOnly: true,
    })
    @AdminField({
        name: 'Giorno della settimana',
        type: AdminType.Selection,
        values: days,
        onSummary: true,
    })
    @Column({ nullable: true })
    day: DayOfWeek;

    getId() {
        return this.id;
    }

    getLabel(): string {
        return this.name + ' ' + this.surname;
    }
}
