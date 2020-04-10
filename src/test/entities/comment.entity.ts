import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity from "../../editable-entity";
import {map} from "../../editable-entity";
import Post from "./post.entity";


@Entity("comments")
@AdminUI("Comment")
export default class Comment extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true, onSummary: true })
    id: number;

    @Column()
    @AdminField({ name: "Text", type: AdminType.RichText, onSummary: true, searchable: true, uiSettings: { listTemplate: '/safe' } })
    text: string;

    @ManyToOne(type => Post, post => post.comments, { eager: true })
    @AdminField({ name: "Post", type: AdminType.Selection, values: async () => map(await Post.find())})
    post: Post;

    getId() {
        return this.id;
    }

    getLabel(): string {
        let c = this.text || "";
        if (c.length < 20) {
            return c;
        }
        return c.substring(0, 20) + "...";
    }

}