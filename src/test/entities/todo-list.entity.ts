import { Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { AdminUI, AdminField, AdminType, QueryParams } from "../../decorators";
import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity from "../../editable-entity";
import Request from "lynx-framework/request";
import Todo from "./todo.entity";

async function fetchComments(req: Request, todo: TodoList, params: QueryParams): Promise<[any[], number]> {
    return await Todo.findAndCount({
        where: {
            todo: todo,
        },
        take: params.take,
        skip: params.skip,
        order: params.order,
    });
}

@Entity("todo_lists")
@AdminUI("Todo List")
export default class TodoList extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: "Id",
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    id: number;

    @OneToMany((type) => Todo, (todo) => todo.list)
    @AdminField({ name: "Todo List", type: AdminType.Table, selfType: "Todo", query: fetchComments, inverseSide: 'list' })
    todo: Todo[];

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.id + "";
    }
}
