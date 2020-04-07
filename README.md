# AdminUI

The AdminUI module automatically generate a user interface to list, view, edit and create new data from tagged entities.

The UI can be personalized and integrated inside other templates, and routes can be protected with middleware.


Beside the user interface, also a CRUD RESTFul API is automatically generated.


# How to
AdminUI generates the interface using annotated entities.
An entity shall be annotated with `AdminUI` and implement the `EditableEntity` interface. Any property of the entity annotated with `AdminField` will be available in the interface.

# Documentation

## `AdminUI` annotation
Usage:
```
@Entity("categories")
@AdminUI("Category")
export default class Category extends BaseEntity implements EditableEntity {
    ...
}
```

Beside the standard `Entity` annotation, the `AdminUI` shall be placed when an entity is defined. The `string` argument indicates a readable name of the entity, that will be used in the UI. Localized string are supported and will be automatically used in the UI.

## `EditableEntity` interface
An -AdminUI- entity shall also implements the `EditableEntity`. To implement the interface, the class shall have these two methods:
```
    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }
```

The `getId` method shall return the primary key of the entity. The `getLabel` shall return a readable representation of the entity. 
The `getId` method is used to find the entity by id, and it can be used to correctly return the corresponding property.

NOTE: if the entity does not implements the `EditableEntity`, the AdminUI behavior can be unpredictable.

## `AdminField` annotation
The `AdminField` annotation indicates that the field should be editable from the AdminUI interface.
The required parameters are the following:
```
    @Column()
    @AdminField({ name: "Bio", type: AdminType.RichText })
    biography: string;
```
The `name` indicates a readable string for the property (supporting localized strings).
The `type` indicates the type of input to be used in the interface, defined by the `AdminType` enum.
Other parameters of the `AdminField` annotation can be mandatory based on the chosen type.

### `AdminField` other parameters
There are also a set of optional parameters, available on all types:
* `onSummary`: indicates if the field shall appear in the list view; default: `false`.
* `searchable`: indicates if the field can be searchable in the list view; default: `false`.
* `readOnly`: indicates if the field can be only readable in the editor view; default: `false`. This parameter can be a `boolean` value, or a function like `(req: Request, currentEntity: any) => Promise<boolean>` (same as the `values` but with different return type).
* `uiSettings`: contains information on how the fields should appear in the editor interface and in the filtering section of the list interface. In both cases, widgets are displayed in the typical 12 column grid system. The `editorClasses` and `filterClasses` properties of `uiSettings` can add custom CSS classes to the widget (default to `col-12`).

### `AdminField` types

#### `AdminType.Id`
Indicates that the field is an identifier.

#### `AdminType.String`
Indicates that the field is a string. It uses the standard input with type text.

#### `AdminType.Text`
Indicates that the field is a long text. It uses the textarea.

#### `AdminType.Selection`
Indicates that the field can only have a set of values. It uses the select widget.
It is also necessary to specify the `values` parameter.
Example:
```
const genderValues = [
    { key: Gender.male, value: "Maschio" },
    { key: Gender.female, value: "Femmina" },
    { key: Gender.other, value: "Altro" }
];
...
    @Column()
    @AdminField({
        name: "Gender",
        type: AdminType.Selection,
        values: genderValues
    })
    gender: Gender;
...
```

#### `AdminType.RichText`
Indicates that the field is a long Html text. It uses a RichText editor.
By default, the Quill editor is used.

#### `AdminType.Checkbox`
Indicates that the field can be checked or not, or that the field can have multiple value from a set of values. It uses a single checkbox, or a list of checkboxes.
Example with single checkbox:
```
    @Column()
    @AdminField({ name: "Privacy accettata", type: AdminType.Checkbox })
    privacy: boolean;
```

Example with a list of checkboxes:
```
    @ManyToMany(type => Category, { eager: true })
    @JoinTable()
    @AdminField({
        name: "Altre categorie",
        type: AdminType.Checkbox,
        values: getCategories,
        selfType: Category
    })
    subcategories: Category[];
```
In this particular case, the checkboxes are used to map a many-to-many relationship. The `values` parameter is a function (see the `values` paragraph) and also the `selfType` is specified.


#### `AdminType.Radio`
Indicates that the field can only have a set of values. Each value is displayed as a radio button.
It works exactly as the `AdminType.Selection`, but it will use the radio buttons as widgets.


### `values` parameter
It indicates a list of key-value items that can be used to evaluate the field. 
It accepts both a static array, or a function.
The array is defined as `{ key: any; value: string }[]`.
The function is defined as `(req: Request, currentEntity: any) => Promise<{ key: any; value: string }[]>`, where `req` is the current request, and `currentEntity` is the current display entity. The `currentEntity` could be an empty object, if this function is called for the list view.
The AdminUI module define also a `map` function that automatically map an array of `EditableEntity` to `{ key: any; value: string }`. It is defined in the `editable-entity` file.
A typical implementation of the `values` function could be:
```
import { map } from "../modules/admin-ui/editable-entity";
async function getCategories() {
    return map(await Category.find());
}
```
that returns the complete list of `Category` mapped to the key-value array. Please note that the `req` and `currentEntity` parameters are omitted.


### `selfType` parameter
To correctly work, the AdminUI module needs to know the correct type of each `AdminField`. Most of the times, the module can infer the type automatically. When the type is an array, otherwise, it is necessary to explicitly define the type using the `selfType` parameter.
Example:
```
    @ManyToMany(type => Category, { eager: true })
    @JoinTable()
    @AdminField({
        name: "Altre categorie",
        type: AdminType.Checkbox,
        values: getCategories,
        selfType: Category
    })
    subcategories: Category[];
```
Since `subcategories` is defined as an array of `Category`, it is necessary to explicit the `selfType` of the single element of the array, that is `Category`. 
NOTE: the Typescript compiler will infer `Array` as type of `subcategories`. 