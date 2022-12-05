import { renderComponent } from '../../';

renderComponent({
    name: 'app-card',
    html: /* html */`
        <h1>{title}</h1>
    `,
    data({ title }){
        return {
            name: 'Wendy',
            title,
            change(){
                this.name = 123;
            },
        };
    },
});
