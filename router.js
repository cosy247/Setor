const hashEvents = new Set();
window.addEventListener('hashchange', () => {
    const { hash } = location;
    hashEvents.forEach((callback) => callback(hash));
});

// 定义router组件
customElements.define('app-router', class extends HTMLElement{
    constructor(){
        super();
        this.innerHTML = '';
        const componentName = this.getAttribute('component');
        const path = `#${this.getAttribute('path')}` || '#';
        const { hash } = location;

        if (path === hash){
            this.innerHTML = `<${componentName}></${componentName}>`;
        }

        hashEvents.add((hash) => {
            if (path === hash){
                this.innerHTML = `<${componentName}></${componentName}>`;
            } else {
                this.innerHTML = '';
            }
        });
    }
},
);
