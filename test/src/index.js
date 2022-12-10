import { createStore, renderRoot, setRootStyle } from '../../';
import './components/AppCard';

createStore({
    username: 'wendy',
    age: 12,
}, {

});

setRootStyle({

});

renderRoot({
    root: '#root',
    html: /* html */ `
        <app-card>
            <h3>{username.value}</h3>
        </app-card>
        <h1>123</h1>
    `,
    data({ event }){
        event.change();
    },
    event: {
        change(){
            this.name = 123;
        },
    },
    store: ({ username, age }) => ({
        username,
        age,
    }),
    style: /* css */ `
        h1 {
            background: #8ad;
        }
    `,
});
