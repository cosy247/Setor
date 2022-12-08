import { renderComponent } from '../../../';

renderComponent({
    name: 'app-card',
    html: /* html */`
        <h1>{title}:{name}</h1>
    `,
    data({ title }){
        return {
            name: 'Wendy',
            title,
        };
    },
    event: {
        change(){
            this.name = 123;
        },
    },
});
