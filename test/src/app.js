import { createComponent } from '../../scripts';
import Card from './components/Card';

export default createComponent({
    components: {
        Card,
    },
    html: /* html */ `
        <Card></Card>
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
