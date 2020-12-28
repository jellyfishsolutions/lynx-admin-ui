import { App, ConfigBuilder } from 'lynx-framework/index';
import BaseModule from 'lynx-framework/base.module';
import AdminUIModule from '..';
import DatagridModule from 'lynx-datagrid';
import Builder from '../builder';
import { AdminType } from '../decorators';

const port = Number(process.env.PORT) || 3000;

let myConfig = new ConfigBuilder(__dirname).setDatabase('adminui').build();

const app = new App(myConfig, [
    new DatagridModule(),
    new AdminUIModule(),
] as BaseModule[]);

AdminUIModule.registerClassFile(__dirname + '/custom-repository/exercise');

let dynamicRepo = {
    name: 'DynamicClass',
    data: {} as any,
    counter: 0,
    makeSave: (e: any) => {
        if (!e.id) {
            dynamicRepo.counter++;
            e.id = dynamicRepo.counter;
        }
        dynamicRepo.data[e.id] = e;
        return e;
    },
    makeRemove: (e: any) => {
        delete dynamicRepo.data[e.id];
        return e;
    },
    factory: () => {
        let k = {
            id: null,
            save: async () => {
                return dynamicRepo.makeSave(k);
            },
            remove: async () => {
                return dynamicRepo.makeRemove(k);
            },
            reload: async () => {
                return k;
            },
            getId: () => {
                return k.id;
            },
            getLabel: () => {
                return k.id;
            },
        };
        return k;
    },
    findOne: async (id: any, options?: any) => {
        return dynamicRepo.data[id];
    },
    customFindAndCount: async () => {
        let all = [] as any[];
        for (let k in dynamicRepo.data) {
            all.push(dynamicRepo.data[k]);
        }
        return [all, all.length];
    },
};

let dynamicClass = new Builder('Dynamic Class', {
    customRepository: () => dynamicRepo as any,
});
dynamicClass.addField('id', {
    name: 'Id',
    type: AdminType.Id,
    readOnly: true,
    onSummary: true,
    selfType: 'String',
});
dynamicClass.addField('html', {
    name: 'html',
    type: AdminType.RichText,
    onSummary: true,
    selfType: 'String',
});

dynamicClass.register();

app.nunjucksEnvironment.addFilter('currency', (str) => str + '€');

app.startServer(port);
