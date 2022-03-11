import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { AdminUI, AdminField, AdminType } from '../../decorators';
import BaseEntity from "lynx-framework/entities/base.entity";
import EditableEntity, { notEditableFromPopup } from "../../editable-entity";
import {map} from "../../editable-entity";
import Post from "./post.entity";

@Entity("comments")
@AdminUI("Comment", {
    disableCreation: true
})
export default class Comment extends BaseEntity implements EditableEntity {
    @PrimaryGeneratedColumn()
    @AdminField({ name: "Id", type: AdminType.Id, readOnly: true, onSummary: true })
    id: number;

    @Column()
    @AdminField({ name: "Text", type: AdminType.RichText, onSummary: true, searchable: true, uiSettings: { listTemplate: '/safe' } })
    text: string;

    @ManyToOne(type => Post, post => post.comments, { eager: true })
    @AdminField({ name: "Post", selfType: 'Post', type: AdminType.Selection, readOnly: notEditableFromPopup, values: async () => map(await Post.find())})
    post: Post;


    @Column()
    display: boolean = true;

    @AdminField({ name: 'I am a BUTTON', type: AdminType.ActionButton, uiSettings: { innerEditorClasses: 'btn btn-warning' }, hide: async (_, k) => k.display  })
    async actionButton() {
        console.log("I'm a function!!");
        this.display = true;
    }

    @AdminField({ name: 'I am a BUTTON 2', type: AdminType.ActionButton, uiSettings: { innerEditorClasses: 'btn btn-danger' }, hide: async (_, k) => !k.display  })
    async actionButton2() {
        console.log('sono una 2');
        this.display = false;
    }

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