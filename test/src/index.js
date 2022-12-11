import { renderRoot, setRootStyle, setSore } from '../../';
import './components/AppCard';

setSore({
    username: 'wendy',
    age: 12,
});

setRootStyle(/* css */`

`);

renderRoot({
    root: '#root',
    html: /* html */ `
        <app-card>
            <h3>123123123123</h3>
        </app-card>
        <h1>123</h1>
    `,
    data(){
        console.log(this);
        return {};
    },
    event: {
        change(){
            this.name = 123;
        },
    },
    style: /* css */ `
        h1 {
            background: #8ad;
        }
    `,
});
