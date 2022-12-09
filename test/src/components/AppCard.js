import { renderComponent } from '../../../';

renderComponent({
    name: 'app-card',
    html: /* html */`
        <h1 @clk='handle()'>name:{username}</h1>
    `,
    data({ store }){
        return {
            username: store.username,
        };
    },
    event: {
        handle(){
            this.$store.username = 1111111111111;
        },
    },
});
