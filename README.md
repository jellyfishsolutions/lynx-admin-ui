# AdminUI

The AdminUI module automatically generate a user interface to list, view, edit and create new data from tagged entities.

The UI can be personalized and integrated inside other templates, and routes can be protected with middleware.


Beside the user interface, also a CRUD RESTFul API is automatically generated.


# How to
AdminUI generates the interface using annotated entities.
An entity shall be annotated with `AdminUI` and implement the `EditableEntity` interface. Any property of the entity annotated with `AdminField` will be available in the interface.

# Installation
AdminUI is available on NPM as a Lynx module. It depends on the Datagrid Lynx module, that will be automatically installed by NPM.
```
    npm install lynx-admin-ui --save
```

In the `index.ts` of the application:

```
import AdminUIModule from "lynx-admin-ui";
import DatagridModule from "lynx-datagrid";

...

const app = new App(myConfig, [new DatagridModule(), new AdminUIModule()] as BaseModule[]);


```

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

Beside the standard `Entity` annotation, the `AdminUI` one shall be added when an entity is defined. The `string` argument indicates a readable name of the entity, that will be used in the UI. Localized string are supported and will be automatically used in the UI.

### `AdminUI` optional argument
The `AdminUI` annotation supports also an optional object argument, with the following optional parameters:
* `filterBy`: defines a function to generate an appropriate `where` clause used to filter the data in the list section of the AdminUI. It receives the current `req` request as argument;
* `editorTemplate` and `editorParentTemplate` allow to specifies a custom editor template for the current entity;
* `popupEditorTemplate` and `popupEditorParentTemplate` allow to specifies a custom popup editor template for the current entity;
* `listTemplate` and `listParentTemplate` allow to specifies a custom list template for the current entity;
* `listActionTemplate` allows to specifies a custom template to be used as the 'action' column (the last one) in the listing template.

Each "template" parameter accepts both a `string`, containing the specified path, or a function that accept the current `req` request as argument and returns a `string`. Using the function version, it is possible to customize a template based on a specific request.

## `EditableEntity` interface
An `AdminUI` entity shall also implements the `EditableEntity`. To implement the interface, the class shall have these two methods:
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

NOTE: the `AdminType` enum is a number. Other custom types can be used instead.

### `AdminField` other parameters
There is a set of optional parameters, available on all types:
* `onSummary`: indicates if the field shall appear in the list view; default: `false`.
* `searchable`: indicates if the field can be searchable in the list view; default: `false`.
* `readOnly`: indicates if the field can be only readable in the editor view; default: `false`. This parameter can be a `boolean` value, or a function like `(req: Request, currentEntity: any) => Promise<boolean>` (same as the `values` but with different return type).
* `uiSettings`: contains information on the visual appearance of the field. See the `uiSettings` paragraph for more information.

### `AdminField` types

#### `AdminType.Id`
Indicates that the field is an identifier.

#### `AdminType.String`
Indicates that the field is a string. It uses the standard input with type text.
It is possible to specify the `pattern` parameters (a `string`), in order to perform input validation. This parameter maps the input `pattern` attribute.

### `AdminType.Number`
Indicates that the field is a number. It uses the standard input with type number.
It is possible to specify the `min`, `max` and `step` values.

### `AdminType.Date`
Indicates that the field is a date. It uses the standard input with type date.

#### `AdminType.Text`
Indicates that the field is a long text. It uses the textarea.

#### `AdminType.Selection`
Indicates that the field can only have a set of values. It uses the select widget.
It is also necessary to specify the [`values` parameter](#values-parameter).
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
    @AdminField({ name: "Accept privacy", type: AdminType.Checkbox })
    privacy: boolean;
```

Example with a list of checkboxes:
```
    @ManyToMany(type => Category, { eager: true })
    @JoinTable()
    @AdminField({
        name: "Other categories",
        type: AdminType.Checkbox,
        values: getCategories,
        selfType: Category
    })
    subcategories: Category[];
```
In this particular case, the checkboxes are used to map a many-to-many relationship. The `values` parameter is a function (see the [`values` paragraph](#values-parameter)) and also the [`selfType` is specified](#selfType-parameter).


#### `AdminType.Radio`
Indicates that the field can only have a set of values. Each value is displayed as a radio button.
It works exactly as the `AdminType.Selection`, but it will use the radio buttons as widgets.

#### `AdminType.Table`
This type can be used for `OneToMany` relations. It allows to display the relationship elements in a table, supporting pagination and column orders.
It works only if the [`query` parameter](#query-parameter) is set.

#### `AdminType.Expanded`
This type can be used for `OneToOne` relations, when the target entity of the relation is available to the AdminUI.
In this case, the fields of the target entity will be available inside the interface of the main entity.

### `AdminType.Time`
Indicates that the field is a time. It uses the standard input with type time. It is possible to indicates the minimum and the maximum times using the `min` and `max` parameters (they shall be a string using the 'HH:mm' format).


### `values` parameter
It indicates a list of key-value items that can be used to evaluate the field. 
It accepts both a static array, or a function.
The array is defined as `{ key: any; value: string }[]`.
The function is defined as `(req: Request, currentEntity: any) => Promise<{ key: any; value: string }[]>`, where `req` is the current request, and `currentEntity` is the current displayed entity. If this function is called for the list view, the `currentEntity` is an empty object.


### `selfType` parameter
To work correctly, the AdminUI module needs to know the type of each `AdminField`. Most of the times, the module can infer the type automatically. When the type is an array, otherwise, it is necessary to explicitly define the type using the `selfType` parameter.
Example:
```
    @ManyToMany(type => Category, { eager: true })
    @JoinTable()
    @AdminField({
        name: "Categories",
        type: AdminType.Checkbox,
        values: getCategories,
        selfType: 'Category'
    })
    subcategories: Category[];
```
Since `subcategories` is defined as an array of `Category`, it is necessary to explicit the `selfType` of the single element of the array, that is `Category`. 
The `selfType` is a `string` values, so it is necessary to convert the name of the class, for example `Category`, to `'Category'`.
NOTE: the Typescript compiler will infer `Array` as type of `subcategories`. 

### `query` parameter
When the `query` parameter is specified, the related field value will be transformed in a `Datagrid` object, allowing grid or table visualization inside the editing view.
The `query` parameter is defined as a function, that is called as the `executor` of a `Datagrid` object (please refer to the [Datagrid documentation](https://github.com/jellyfishsolutions/lynx-datagrid)).
Usage:
```
async function fetchComments(req: Request, entity: Post, params: QueryParams): Promise<[any[], number]> {
    return await Comment.findAndCount({
        where: {
            post: entity,
        },
        take: params.take,
        skip: params.skip,
        order: params.order,
    });
}
...
    @OneToMany((type) => Comment, (comment) => comment.post)
    @AdminField({ name: "Comments", type: AdminType.Table, selfType: "Comment", query: fetchComments })
    comments: Comment[];

```

In addition to the usual `Datagrid` parameter (third argument), the `query` function has also the current `req` Request (as first argument), and also the current `entity` (as second argument). As depicted in the example, it is possible to use the the `entity` to correctly filter the useful data.

If the `selfType` of the current object is available as an `AdminUI` entity, after the execution of the `query` function, the returned data will be automatically cleaned as defined by their annotation (only annotated visible fields will be available in the grid or table view).


### `uiSettings` parameter
The `uiSettings` parameter contains information on how the fields should appear in the editor interface and in the filtering section of the list interface.
By default, both in the editor and in the filtering section, widgets are displayed in the typical 12 column grid system.

This parameter defines the following optional properties:

* `editorClasses`: indicates custom CSS classes to the widget when displayed in the editor section (default to `col-12`).
* `filterClasses`: indicates custom CSS classes to the widget when displayed in the filtering section (default to `col-12`).
* `listTemplate`: indicates a custom template to be used in the list view. The template can access the `value` variable, containing the current value of the field.

Moreover, in the editor section, each field is wrapped inside a `div` with an unique id. The id is defined as `field-{{entity-name}}-{{name-of-the-field}}`. Using the id, it is possible to customize though CSS rules the aspect of a single field.

## Utility functions

### `map` function
The AdminUI module define also a `map` function that automatically map an array of `EditableEntity` to `{ key: any; value: string }`. It is defined in the `editable-entity` file.
A typical implementation of the `values` function could be:
```
import { map } from "../modules/admin-ui/editable-entity";
async function getCategories() {
    return map(await Category.find());
}
```
that returns the complete list of `Category` mapped to the key-value array. Please note that the `req` and `currentEntity` parameters are omitted.

### `notEditableFromPopup` function
The `notEditableFromPopup` function returns `true` when the editing of a entity is requested as a popup. 
The popup editing happens then a user add or edit an entity from a relation displayed as a table. In this case, the inverse relation should not be editable inside the popup.

## Personalization

### Template
AdminUI uses different templates to display the data in different situation. Each template can be customized. Moreover, it possible to customize only the father template of each view, in order to adapt the default layout inside the general theme of the portal.
The used templates are the following:
* list template: used to display the main list of the entity;
* editor template: used to edit the entity;
* popup template: used to edit the entity inside a popup;
* nested template: used to display the entity list inside a relation (nested table inside the standard edit view).

For each template, it is available a method, like the `AdminUI.setEditorTemplatePath`, to customize the the template path.
To customize the father template, it is possible to use the `AdminUI.setEditorParentTemplatePath` methods family.

The only requirement for a father template, is that defines the following blocks:
* `additional_styles`: is used to add additional CSS resources and styles;
* `additional_scripts`: is used to add additional JS resources and scripts;
* `body`: the section of the page in which display the main content.

This blocks will be used by each templates to correctly load any additional resource, and to display its content.


### CSS Classes
Buttons, fields and tables have additional classes, allowing custom CSS themes.
The classes are defined as follows:
* `btn-create` and `btn-create-{entity-name}` are used for the "Create" button in the list page;
* `table` and `table-{entity-name}` are used for the table in the list page;
* `header-{field-name}` is used on the `th` cell of the table in the list page;
* `cell-{field-name}` is used on the `td` cell of the table in the list page;
* `btn-details` and `btn-details-{entity-name}` are used for the "Details" button in the list page;
* `btn-delete` and `btn-delete-{entity-name}` are used for the "Delete" button in the list page;
* `field-{entity-name}-{field-name}` is used to any field in the editing page;
* `btn-save` and `btn-save-{entity-name}` are used for the "Save" button in the editing page;


### Custom types
It is possible to add custom types in order to support a larger set of fields.
Use the `AdminUI.setEditor` static method to add a new type.
The same method could also be used to use a custom template for an original type.

IMPORTANT: for custom field type, please use numbers greater then `300`, in order to prevent conflict with the original field types.
