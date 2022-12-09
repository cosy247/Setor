import { renderRoot } from '../../';
import './components/AppCard';

renderRoot({
    root: '#root',
    html: /* html */ `
        <h1>name: 123</h1>
        <h1>name: </h1>
        <button @click="change">123</button>
        <app-card>name</app-card>
        
        <style>
            * {
                margin: 10px 0;
                padding: 0;
            }
            h1 {
                background-color: rgb(64, 167, 106);
            }
        </style>
    `,
    event: {
        change(){
            console.log(this);
            this.name = 123;
        },
    },
    store: {
        username: (va = 1) => va,
    },
});
