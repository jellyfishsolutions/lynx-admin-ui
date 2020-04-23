import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable
} from "typeorm";
import { AdminUI, AdminField, AdminType } from "../../decorators";
import BaseEntity from "lynx-framework/entities/base.entity";
import Category from "./category.entity";
import { map } from "../../editable-entity";
import { Request } from "lynx-framework/request";

export enum Gender {
    male,
    female,
    other
}

const genderValues = [
    { key: Gender.male, value: "Maschio" },
    { key: Gender.female, value: "Femmina" },
    { key: Gender.other, value: "Altro" }
];

async function getCategories() {
    return map(await Category.find());
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
            gender: Gender.female
        }
    }
    return {}
}

async function listTemplate(req: Request): Promise<string> {
    if (req.query.onlyFemale) {
        return '/female-list';
    }
    return "";
}

async function actionTemplate(req: Request): Promise<string> {
    if (req.query.onlyFemale) {
        return '/female-list-action';
    }
    return "";
}


@Entity("complex")
@AdminUI("Complex Entity", {
    filterBy: filteringList,
    listParentTemplate: listTemplate,
    listActionTemplate: actionTemplate
})
export default class Complex extends BaseEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: "Id",
        type: AdminType.Id,
        readOnly: true,
        onSummary: true
    })
    id: number;

    @Column()
    @AdminField({
        name: "Name",
        type: AdminType.String,
        onSummary: true,
        searchable: true,
        uiSettings: { editorClasses: "col-6", filterClasses: "col-6" }
    })
    name: string;

    @Column()
    @AdminField({
        name: "Surname",
        type: AdminType.String,
        onSummary: true,
        searchable: true,
        uiSettings: { editorClasses: "col-6", filterClasses: "col-6" }
    })
    surname: string;

    @Column()
    @AdminField({
        name: "Email",
        type: AdminType.String,
        pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
    })
    email: string;

    @Column()
    @AdminField({
        name: "Gender",
        type: AdminType.Selection,
        values: genderValues
    })
    gender: Gender;

    @Column()
    @AdminField({
        name: "Age",
        type: AdminType.Number,
        step: 1,
        min: 13
    })
    age: number;

    @Column()
    @AdminField({
        name: "Date of Birth",
        type: AdminType.Date
    })
    dateOfBirth: Date;

    @Column()
    @AdminField({ name: "Bio", type: AdminType.RichText, readOnly: isReadOnly })
    biography: string;

    @Column()
    @AdminField({ name: "Privacy accettata", type: AdminType.Checkbox })
    privacy: boolean;

    @Column()
    @AdminField({
        name: "Poteri",
        type: AdminType.Radio,
        values: [
            { key: 1, value: "Super" },
            { key: 2, value: "Normale" }
        ]
    })
    power: number;

    @ManyToOne(type => Category, { eager: true })
    @AdminField({
        name: "Categoria",
        type: AdminType.Selection,
        values: getCategories,
        onSummary: true,
        searchable: true
    })
    category: Category;

    @ManyToMany(type => Category, { eager: true })
    @JoinTable()
    @AdminField({
        name: "Altre categorie",
        type: AdminType.Checkbox,
        values: getCategories,
        selfType: 'Category',
        onSummary: true,
        uiSettings: {
            listTemplate: '/chips'
        }
    })
    subcategories: Category[];
}
