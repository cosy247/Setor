import { createComponent } from '../../scripts';
import './components/Card';

createComponent({
    name: 'app-root',
    html: /* html */ `
        <app-card/>
        <app-card />
        <app-card   app />
        <h1>123</h1>
    `,
    data(){
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
