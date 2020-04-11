import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { AdminUI, AdminField, AdminType, QueryParams } from "../../decorators";
import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity from "../../editable-entity";
import Comment from "./comment.entity";
import Request from "lynx-framework/request";

async function fetchComments(req: Request, post: Post, params: QueryParams): Promise<[any[], number]> {
    return await Comment.findAndCount({
        where: {
            post: post,
        },
        take: params.take,
        skip: params.skip,
        order: params.order,
    });
}

@Entity("posts")
@AdminUI("Post")
export default class Post extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({
        name: "Id",
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    id: number;

    @Column()
    @AdminField({
        name: "Content",
        type: AdminType.RichText,
        onSummary: true,
        searchable: true,
    })
    content: string;

    @OneToMany((type) => Comment, (comment) => comment.post)
    @AdminField({ name: "Comments", type: AdminType.Table, selfType: "Comment", query: fetchComments, inverseSide: 'post' })
    comments: Comment[];

    getId() {
        return this.id;
    }
    getLabel(): string {
        let c = this.content || "";
        if (c.length < 20) {
            return c;
        }
        return c.substring(0, 20) + "...";
    }
}
