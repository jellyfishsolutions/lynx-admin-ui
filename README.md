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

-   `filterBy` defines a function to generate an appropriate `where` clause used to filter the data in the list section of the AdminUI. It receives the current `req` request as argument;
-   `editorTemplate` and `editorParentTemplate` allow to specify a custom editor template for the current entity;
-   `popupEditorTemplate` and `popupEditorParentTemplate` allow to specify a custom popup editor template for the current entity;
-   `listTemplate` and `listParentTemplate` allow to specify a custom list template for the current entity;
-   `listActionTemplate` allows to specify a custom template to be used as the 'action' column (the last one) in the listing template;
-   `batchDelete` if true (or if resolve to true), checkboxes will be displayed for each list element, enabling a batch delete of elements;
-   `relations` allows to specify the name of parameters of the entity (that are relations) that needs to be loaded with the entity (useful in conjunction with `disableReloadOnList` parameter or to filtering/search entity with a particular relation);
-   `disableCreation` if true (or if resolve to true), the button to create a new entity is not displayed;
-   `disableDelete` if true (or if resolve to true), the button to delete an entity is not displayed;
-   `defaultOrderBy` if specified, defines a default order by used in the entity list (it uses the same notation of the ordering string used when a column header is tapped);
- `disableReloadOnList` if true (or if resolve to true), the displayed entities in the list are not reloaded. Please refer to [optimization section](#Listing page optimization) for additional info.
-   `customFetchData` allows you to create your custom query when retrieving data for the list trough a function that receives the current `req` as well as datatable infos. If defined, the default query building process will not be executed, meaning your `filterBy` function will have no effect.
-  `uiSettings` contains information of the visual appearence of the entity views. See the `AdminUI uiSettings` paragraph for more information.

Each "template" parameter accepts both a `string`, containing the specified path, or a function that accept the current `req` request as argument and returns a `string`. Using the function version, it is possible to customize a template based on a specific request.


#### `AdminUI uiSettings parameter`
This parameter contains information about how the entity view should appear in the interface, and defines the following optional properties: 

- `tabs`:  if this property is defined, the detail view of the entity will be split into tabs. This object also define which tabs will be present and thier labels. You can assign the entity fields to a tab through their own `uiSettings` property. The object has the following type: `{ key: string; label: string }[]`. Each element of the array contains a `key` to address the tab, and a ´label`, that will be displayed as the tab title in the view.
- `defaultTab`: is a property of the type: `string`, and indicates which tab is the one selected by default. This property value should match the `key` property of one of the defined tabs.
- `hasRightColumn`: is a property of the type: `boolean`. If the value of this property is `true`, the details view is split in two columns. The second columns will contains the action buttons, like the save button. The `uiSettings` property of each field contains an option to move this field to the right column, just above the action buttons. It could be useful, for instance, to move a "preview image" field to the right column, to highlight the field. 
- `hideTabsInExpanded`: is a property of the type: `boolean` that decides if the tabs layout is rendered also in the expanded view of the field.
- `hideTabsInModal`: is a property of the type: `boolean` that decides if the tabs layout is rendered also in the modal view of the field.
- `smartSearchableHint`: the string to be visualized as hint text for the smart search field (can be localized).
- `noDataString`: indicates a custom localized string to be used when no data is available in the list view.
- `noDataTemplate`: indicates a custom nunjucks template to be used when no data is available in the list view.
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

The `EditableEntity` allows also the definition of methods to intercept the life-cycle of the entity:

-   `onBeforeSave`: this method (if implemented) will be executed just BEFORE the saving action of an entity. The entity is already updated with the latest value inserted by the user. If an exception is thrown in this method, the saving process will be interrupted.
-   `onAfterSave`: this method (if implemented) will be executed just AFTER the saving action of an entity.

Both methods are executed with the current `req` request as argument (that can be used or accessed by this methods to perform additional operations or checks).

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

-   `onSummary`: indicates if the field shall appear in the list view; default: `false`.
-   `searchable`: indicates if the field can be searchable in the list view; default: `false`.
-   `smartSearchable`: indicates if the field can be searchable, added to a general "string-like" search; default: `false`.
-   `readOnly`: indicates if the field can be only readable in the editor view; default: `false`. This parameter can be a `boolean` value, or a function like `(req: Request, currentEntity: any) => Promise<boolean>` (same as the `values` but with different return type).
-   `required`: indicates if the field is "required" in the editor view; default: `false`. It adds the "required" attribute to the generated input. This parameter can be a `boolean` value, or a function like `(req: Request, currentEntity: any) => Promise<boolean>` (same as the `values` but with different return type).
-   `hide`: indicates if the field should be displayed or not in the editor view; default: `false`. This parameter can be a `boolean` value, or a function like `(req: Request, currentEntity: any) => Promise<boolean>` (same as the `values` but with different return type).
-   `defaultValue`: allows to define a default value for the field. It can be a value, or a function like `(req: Request, currentEntity: any) => Promise<any>`.
-   `uiSettings`: contains information on the visual appearance of the field. See the `uiSettings` paragraph for more information.
-   `optionalParameters` contains optional custom parameters that can be used by the editor. 

### `AdminField` types

#### `AdminType.Id`

Indicates that the field is an identifier.

#### `AdminType.String`

Indicates that the field is a string. It uses the standard input with type text.
It is possible to specify the `pattern` parameters (a `string`), in order to perform input validation. This parameter maps the input `pattern` attribute.

#### `AdminType.Number`

Indicates that the field is a number. It uses the standard input with type number.
It is possible to specify the `min`, `max` and `step` values.

#### `AdminType.Date`

Indicates that the field is a date. It uses the standard input with type date.

#### `AdminType.Time`

Indicates that the field is a time. It uses the standard input with type time. It is possible to indicates the minimum and the maximum times using the `min` and `max` parameters (they shall be a string using the 'HH:mm' format).

#### `AdminType.DateTime`

Indicates that the field is a date. It uses the standard input with type `datetime-local`.

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

#### `AdminType.AjaxSelection`

Indicates that the field can only have a set of values, dynamically loaded using an ajax request.
It uses the select widget updated with the `Select2` library in order to provide a searchability of the options.
This type is intended to be used when the set of values is huge, or/and if options searchability is needed.
It is also necessary to specify the [`searchRequest` parameter](#searchRequest-parameter).
Example:

```
async function filteredCategories(req: Request, currentEntity: any, search: string, page: number): Promise<[{key: any, value: string}[], boolean]> {
    let skip = 10 * (page - 1);
    let take = 10;
    let qb = Category.createQueryBuilder("q");
    if (search && search.length > 0) {
        qb = qb.where("q.name LIKE :l", { l: '%'+search+'%' });
    }
    let searched = map(await qb.skip(skip).take(take).getMany());
    return [searched, searched.length > 0];
}
...
    @ManyToOne(type => Category, { eager: true })
    @AdminField({
        name: "Categoria con filtro ajax",
        type: AdminType.AjaxSelection,
        searchRequest: filteredCategories,
        onSummary: true,
        searchable: true
    })
    categoryAjax: Category;
```

#### `AdminType.RichText`

Indicates that the field is a long Html text. It uses a RichText editor.
By default, the Quill editor is used.
It is possible to customize the Quill editor options using the `optionalParameters` value. A complex rich text editor is available using the `defaultRichTextParameters` exported by the `lynx-admin-ui/rich-text-options` file. The `optionalParameters` shall contains the complete Quill configuration, with the `theme` and `modules` properties.

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
If the `max` parameter is specified, the "Add" button will be displayed only if the total number returned by the `query` parameter is minor or equal then the `max` parameter.

#### `AdminType.Expanded`

This type can be used for `OneToOne` relations, when the target entity of the relation is available to the AdminUI.
In this case, the fields of the target entity will be available inside the interface of the main entity.
If the `readOnly` parameter is specified and, during the request, is resolved to `true`, the parameter is automatically inherited by any fields of the expanded entity. Otherwise, the `readOnly` parameter of any fields of the expanded entity is used as expected.
The same behavior is applied also for the `hide` parameter.

The `AdminType.Expanded` supports also the `fieldset` optional property. If `true`, the input of the target entity will be rendered inside an html `fieldset` element.

#### `AdminType.ExpandedAndSelection`

This type has the same function of the original `AdminType.Expanded`, but also provides the possibility to select the entire entity with a ajax selection (using a similar functionality to `AdminType.AjaxSelection`).
For this reason, it is necessary to specify the [`searchRequest` parameter](#searchRequest-parameter).

If the `readOnly` parameter resolve to `true`, both the selection and the editing of any field is not allowed. If the selection can be changed but the "expanded" fields shall be in readonly mode, it is possible to specify the `readOnlyExpanded` as `true` in the `optionalParameters` field.
Moreover, the `fieldset` optional property is supported.

#### `AdminType.Color`

Indicates that the field is a color. It uses the standard input with type color.

#### `AdminType.Media`

Indicate that the field is a media (that needs to be uploaded).
The media is uploaded and saved as a `MediaEntity` of the Lynx framework, inside the root directory.
Example:

```
    @ManyToOne(type => MediaEntity, { eager: true })
    @JoinColumn()
    @AdminField({ name: 'File', type: AdminType.Media, onSummary: false})
    file: MediaEntity;
```

It is possible to specify the `accept` parameter, in order to filter the type of file to be uploaded. This parameter maps the input `accept` attribute.

#### `AdminType.ActionButton`

This special type shall be used with a class method, and not with the classic class attribute.
In the editor page, instead of an input field, a button is displayed. The `name` parameter is used as text of the button.
Clicking the button automatically submit the editor form. During the saving process, the corresponding method will be executed.

By default, a `btn` class is added to the button widget, but it can be overridden using the property `innerEditorClasses` of `uiSettings`.

> Asynchronous functions are supported

Example:

```
    @AdminField({ name: 'I am a BUTTON', type: AdminType.ActionButton, uiSettings: { innerEditorClasses: 'btn btn-warning' }, hide: async (_, k) => k.display  })
    async actionButton() {
        console.log("I'm a function!!");
        this.display = true;
    }
```

#### `AdminType.Currency`

Indicates that the field is a currency. The implementation uses the [Jquery.inputmask plugin](https://robinherbots.github.io/Inputmask/) to correctly display a mark for decimal and hundreds. Moreover, it is not possible to input characters.
It is possible to override the decimal separator with the `decimalSeparator` attribute (`.` as default), the hundreds separator with the `hundredsSeparator` attribute (`,` as default) and the number of decimal numbers with the `digits` attribute (`2` as default). Both `decimalSeparator` and `hundredsSeparator` attributes can be a `string`, or a function defined as `(req: Request, currentEntity: any) => Promise<string>`, where `req` is the current request, and `currentEntity` is the current displayed entity.


#### `AdminType.CustomInclude`

This type can be used to add a custom UI inside the editor view of an entity.
It is possible to create a "dummy" property of the class, without adding a "column" annotation (in order to do not add a column to the real database entity).
A view, defined in the `template` of the `optionalParameters` object of the field, will be included directly in the editor view, allowing a total customization of the page portion.

Example: 

```
@AdminField({
    name: 'Custom element',
    type: AdminType.CustomInclude,
    optionalParameters: {
        template: '/custom-element',
    },
})
_customElement: string;
```

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

### `searchRequest` parameter

The `searchRequest` parameter contains information on how to dynamically obtain options for a particular field.

The `searchRequest` parameter shall be an asynchronous function with the following parameters:

-   `req`, the current Lynx request;
-   `currentEntity` is the current `entity`;
-   `search` contains what the user typed for searching (can be empty);
-   `page` the current request page (if pagination is supported).

The result of this function shall be a `Promise<[{key: any, value: string}[], boolean]>`. The first element of the tupla is the usual key-value array, containing the list of options (the `map` method can be used to automatically transform an `EditableEntity` to this type). The second element contains info about pagination. If its value is `true`, it means that other data can be requested (and other request, with greater `page` value, will be delivered). If `false`, no further date is available.

### `uiSettings` parameter

The `uiSettings` parameter contains information on how the fields should appear in the editor interface and in the filtering section of the list interface.
By default, both in the editor and in the filtering section, widgets are displayed in the typical 12 column grid system.

This parameter defines the following optional properties:

-   `editorClasses`: indicates custom CSS classes to the widget when displayed in the editor section.
-   `innerEditorClasses`: indicates custom CSS classes, internally used by the widget (for example, for the `input` tag). This can be used differently by different types.
-   `expandedEditorClasses`: indicates custom CSS classes to the widget when displayed as an expanded element in the editor section.
-   `filterClasses`: indicates custom CSS classes to the widget when displayed in the filtering section (default to `col-12`).
-   `listTemplate`: indicates a custom template to be used in the list view. The template can access the `value` variable, containing the current value of the field.
-   `listFilter`: indicates a nunjucks filter that should be applied when the element is rendered on the list.
-   `additionalEditorInfo`: additional info that can be used by the editor template; `any` values accepted.
-   `additionalFilterInfo`: additional info that can be used by the editor template; `any` values accepted.
-   `additionalListInfo`: additional info that can be used by the editor template; `any` values accepted.
-   `descriptionText`: additional `small` text rendered inside the `label` tag. Supports localized strings.
-   `descriptionTextClasses`: custom CSS classes for the `descriptionText`.
-   `editorFullWidth`: indicates if the field should occupy the full width of the view in the editor instead of the half width as by default. This option will be overwritten by `editorClasses`.
-   `tab`: indicates in which tab the field will be inserted. The tab must be addressed through the `key` property. This property has effect only if the `tabs` property of the `uiSettings` of the `AdminUI` optional parameter is defined and has at least one element. See the `AdminUI uiSettings parameter` for further information
-   `onRightColumn`: indicates if the field is rendered in the right column of the detail view. This property should be used only if the `hasRightColumn` property of the `uiSettings` of the `AdminUI` optional parameter is defined as `true`. In the other case, the field will not be rendered.  
-   `actionListTemplate`: indicates a custom nunjucks template to be used as the last column (the actions) if the specified type is `AdminType.Table`.
-   `noDataString`: indicates a custom localized string to be used when no data is available (usable in the `AdminType.Table` type).
-   `noDataTemplate`: indicates a custom nunjucks template to be used when no data is available (usable in the `AdminType.Table` type).

Moreover, in the editor section, each field is wrapped inside a `div` with an unique id. The id is defined as `field-{{entity-name}}-{{name-of-the-field}}`. Using the id, it is possible to customize though CSS rules the aspect of a single field.
In the list section, each field has its own class, defined as `header-{{name-of-the-field}}` and `cell-{{header-of-the-field}}`, for the `th` and the `td` element respectively. These classes apply also for the nested list, used with the `AdminType.Table` type.

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

-   list template: used to display the main list of the entity;
-   editor template: used to edit the entity;
-   popup template: used to edit the entity inside a popup;
-   nested template: used to display the entity list inside a relation (nested table inside the standard edit view).

For each template, it is available a method, like the `AdminUI.setEditorTemplatePath`, to customize the the template path.
To customize the father template, it is possible to use the `AdminUI.setEditorParentTemplatePath` methods family.

The only requirement for a father template, is that defines the following blocks:

-   `additional_styles`: is used to add additional CSS resources and styles;
-   `additional_scripts`: is used to add additional JS resources and scripts;
-   `body`: the section of the page in which display the main content.

This blocks will be used by each templates to correctly load any additional resource, and to display its content.

If you decide to extend the default base layout (eg. to change theme colors by adding a custom css), you can inject different elements to the base layout trough these blocks:

- `custom_scripts`: is used to inject custom scripts at the end of the body
- `custom_styles`: is used to inject custom styles inside the header
- `sidebar_brand`: is used to override the placeholder brand
- `sidebar_nav_items`: is used to fill the sidebar with custom nav items
- `topbar_nav_items`: is used to fill the topbar wih custom nav items

### CSS Classes

Buttons, fields and tables have additional classes, allowing custom CSS themes.
The classes are defined as follows:

-   `btn-create` and `btn-create-{entity-name}` are used for the "Create" button in the list page;
-   `table` and `table-{entity-name}` are used for the table in the list page;
-   `header-{field-name}` is used on the `th` cell of the table in the list page;
-   `cell-{field-name}` is used on the `td` cell of the table in the list page;
-   `btn-details` and `btn-details-{entity-name}` are used for the "Details" button in the list page;
-   `btn-delete` and `btn-delete-{entity-name}` are used for the "Delete" button in the list page;
-   `field-{entity-name}-{field-name}` is used to any field in the editing page;
-   `btn-save` and `btn-save-{entity-name}` are used for the "Save" button in the editing page;

### Custom types

It is possible to add custom types in order to support a larger set of fields.
Use the `AdminUI.setEditor` static method to add a new type.
The same method could also be used to use a custom template for an original type.

IMPORTANT: for custom field type, please use numbers greater then `300`, in order to prevent conflict with the original field types.

### Permissions and security

It is possible to protect routes and frontend actions by defining logic for reading/writing entities.
Use the respective `AdminUI.setCanReadFunction` and `AdminUI.setCanWriteFunction` to accomplish this.
The function receives the express request as first parameter and the name of the entity the current action is being performed on as second;
the function must return a boolean value that will be evaluated to determine if che current request has the access rights to
perform the specified action. 
You can also use the configured function logic on your templates trough the `AUIcanRead` and `AUIcanWrite` template functions.
Please note that if non configured any of the routes and frontend actions **are not protected.**

## Low Level API

Starting from version `v0.5.0`, a new "low level" API is available.
This API allows to create a custom controller to display and edit the entities.
Thought the API it is possible to customize urls and add custom validation based, for example, on the user role.


## Performance optimization

For small-to-medium entities size, the AdminUI provide good performances out of the box.
With large entities, or with entities with a lot of eager relations, some adjustments can be necessary.

### Listing page optimization
The listing page can have a quite poor performance. This is due to a "reloading" of each displayed entity, in order to ensure the correct visualization of any field and eager relation. This is a convenient behavior, but it can also lead to poor performance.
In this cases, it is better to use the `disableReloadOnList` parameter, set to `"false"`, and only load the necessary relations with the `relations` parameter.
Please refer to [`ComplexEntity`](https://github.com/jellyfishsolutions/lynx-admin-ui/blob/master/src/test/entities/complex.entity.ts) as an example.

### Large `values` with `AdminType.Selection`
When the implementation of the `values` returns all the possibility of an entity, there can be performance issues with big dataset. 
This problem can be resolved using the `AdminType.AjaxSelection`, with an autocomplete field.

If the `AdminType.Selection` is used in an "inverted side" of a relation, the `AdminType.AjaxSelection` type cannot be used.
In this case, the best option is to inspect the `req` parameter, searching for a default value as depicted in the following code:

```
@AdminField({
    type: AdminType.Selection,
    name: 'from',
    selfType: 'ProductEntity',
    readOnly: notEditableFromPopup,
    values: async (req, current) => {
        let obj = {};
        try {
            obj = JSON.parse(req.query.defaultValues as string);
        } catch (err) {
            obj = {
                from: req.body.from ?? current?.from?.id,
            };
        }
        return map(await ProductEntity.find({ id: obj.from }));
    },
})
@ManyToOne((type) => ProductEntity, (related) => related.related)
from: ProductEntity;
```

Only the necessary value is retrieved from the database.