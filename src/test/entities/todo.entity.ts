import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from 'lynx-framework/entities/base.entity';
import EditableEntity, {
    notEditableFromPopup,
    map,
} from '../../editable-entity';
import TodoList from './todo-list.entity';
import Media from 'lynx-framework/entities/media.entity';

@Entity('todo')
@AdminUI('Todo', {
    uiSettings: {
        hasRightColumn: true
    }
})
export default class Todo extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    id: number;

    @AdminField({
        name: 'Icona',
        type: AdminType.Media,
        uiSettings: {
            onRightColumn: true,
            editorClasses: "col-12"
        },
        onSummary: true,
    })
    @ManyToOne((type) => Media, { eager: true })
    @JoinColumn()
    icon: Media;

    @Column()
    @AdminField({
        name: 'Content',
        type: AdminType.RichText,
        onSummary: true,
        searchable: true,
    })
    content: string;

    @Column()
    @AdminField({
        name: 'Completed',
        type: AdminType.Checkbox,
        onSummary: false,
        searchable: false,
    })
    completed: boolean;

    @ManyToOne((type) => TodoList, (todo) => todo.todo, { eager: true })
    @AdminField({
        name: 'Todo List',
        type: AdminType.Selection,
        readOnly: notEditableFromPopup,
        selfType: 'TodoList',
        values: async () => map(await TodoList.find()),
    })
    list: TodoList;

    getId() {
        return this.id;
    }
    getLabel(): string {
        let c = this.content || '';
        if (c.length < 20) {
            return c;
        }
        return c.substring(0, 20) + '...';
    }
}
