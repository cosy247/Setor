import { createComponent } from '../../../scripts';
import { store } from '../../../scripts/store';

export default createComponent({
    name: 'app-card',
    html: /* html */`
        <h1 @clk='handle'>name:</h1>
        <slot></slot>
    `,
    data(){
        return {
            person: {
                get username(){
                    return store.username;
                },
            },
        };
    },
    event: {
        handle(){
            this.$store.username++;
        },
    },
});
