import { renderComponent } from '../../../';

renderComponent({
    name: 'app-card',
    html: /* html */`
        <h1 @clk='handle'>name:{person.username}</h1>
        <slot></slot>
    `,
    data({ store }){
        return {
            person: {
                username: () => store.username,
            },
        };
    },
    event: {
        handle(){
            this.$store.username++;
        },
    },
});
