import { App, ConfigBuilder } from 'lynx-framework/index';
import BaseModule from 'lynx-framework/base.module';
import AdminUIModule from '..';
import DatagridModule from 'lynx-datagrid';

const port = Number(process.env.PORT) || 3000;

let myConfig = new ConfigBuilder(__dirname).setDatabase('adminui').build();

const app = new App(myConfig, [
    new DatagridModule(),
    new AdminUIModule(),
] as BaseModule[]);

app.nunjucksEnvironment.addFilter('currency', (str) => str + '€');

app.startServer(port);
