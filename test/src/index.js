import { renderRoot } from '../../';
import './components/AppCard';

renderRoot({
    root: '#root',
    html: /* html */ `
        <app-card>
            <h3>1231231</h3>
        </app-card>
        <h1>123</h1>
    `,
    event: {
        change(){
            this.name = 123;
        },
    },
    store: {
        username: (va = 1) => va,
    },
    rootStyle: /* css */ `
        * {
            padding: 0;
            margin: 0
        }
    `,
});
