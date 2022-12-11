import { renderComponent, store } from '../../../';

renderComponent({
    name: 'app-card',
    html: /* html */`
        <h1 @clk='handle'>name:{person.username}</h1>
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
