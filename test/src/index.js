import { renderRoot } from '../..';
import './components/AppCard';

renderRoot({
    root: '#root',
    html: /* html */ `
        <h1>name: {name}</h1>
        <h1>name: {name}</h1>
        <button @click="change()">{name}</button>
        <app-card +title="123">123</app-card>
        
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
    data: {
        name: 'Wendy',
        change(){
            this.name = 123;
        },
    },
});
