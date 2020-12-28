import { AdminField, AdminType, AdminUI } from '../../decorators';
import { IEntity, IRepository } from '../../index';
import { ExecutorParameter } from 'lynx-datagrid/datagrid';
import EditableEntity from '../../editable-entity';

@AdminUI('Exercise', { customRepository: () => exerciseRepository })
export default class Exercise implements IEntity, EditableEntity {
    @AdminField({
        name: 'Id',
        type: AdminType.Id,
        readOnly: true,
        onSummary: true,
    })
    id: number;

    @AdminField({
        name: 'Nome',
        type: AdminType.String,
        onSummary: true,
    })
    name: string;

    async save(): Promise<IEntity> {
        return exerciseRepository.makeSave(this);
    }
    async remove(): Promise<IEntity> {
        return exerciseRepository.makeRemove(this);
    }

    async reload(): Promise<IEntity> {
        return this;
    }

    getId() {
        return this.id;
    }
    getLabel(): string {
        return this.name;
    }
}

export class ExerciseRepository implements IRepository {
    name: string = 'Exercise';

    data = {} as any;
    counter = 0;

    makeSave(e: Exercise): Exercise {
        if (!e.id) {
            this.counter++;
            e.id = this.counter;
        }
        this.data[e.id] = e;
        return e;
    }

    makeRemove(e: Exercise): Exercise {
        delete this.data[e.id];
        return e;
    }

    factory(): IEntity {
        return new Exercise();
    }
    async findOne(id: any, options?: any): Promise<any> {
        return this.data[id];
    }
    async customFindAndCount(
        where: any,
        params: ExecutorParameter
    ): Promise<[any[], number]> {
        let all = [] as any[];
        for (let k in this.data) {
            all.push(this.data[k]);
        }
        return [all, all.length];
    }
}

export const exerciseRepository = new ExerciseRepository();
