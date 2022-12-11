import Lsnrctl from './lsnrctl';
import Render from './render';

// rootStyle
let rootStyleNode = null;
const setRootStyle = (styleString) => {
    const rootStyleStirng = styleString.trim().replace(/\s+/g, ' ');
    if (rootStyleStirng !== ''){
        rootStyleNode = document.createElement('style');
        rootStyleNode.innerHTML = rootStyleStirng;
        rootStyleNode.setAttribute('name', 'root-style');
        document.head.appendChild(rootStyleNode);
    }
};

const render = (rootSelecter, componentName) => {
    const root = document.querySelector(rootSelecter);
    if (!root){
        console.error('选择器错误:', rootSelecter);
        return;
    }

    const appComponent = document.createElement(componentName);

    setTimeout(() => {
        root.innerHTML = '';
        root.append(appComponent);
    });
};

/** 已经定义的组件 */
const components = {};

/** 创建组件 */
const createComponent = ({ name, html = '', data = {}, event = {}, style = '' }) => {
    if (typeof name !== 'string') throw 'Compoment的name参数应该存在并为string类型';

    // 检查组件是否被定义了
    if (components[name]) return;

    // 检查event属性中是否全为函数
    Object.entries(event).forEach(([key, value]) => {
        if (typeof value !== 'function'){
            throw `Compoment的参数event中的${key}应为函数`;
        }
    });

    // 检查event和data是否有重名属性
    Object.entries(data).forEach(([key]) => {
        if (event[key]){
            throw `Compoment的参数data和event中不应同时存在${key}值`;
        }
    });

    // 处理html代码的自闭和标签
    const htmled = html.trim().replace(/<(?:(?!\/>).|\n)*?\/>/gm, (res) => `${res.slice(0, -2)}></${res.slice(1, res.search(/ |[\\/>]/))}>`);
    const fragment = document.createRange().createContextualFragment(htmled);

    // 定义组件
    customElements.define(name, class extends HTMLElement{
        constructor(){
            super();
            const props = this.retainAttrs || {};
            const shadow = this.attachShadow({ mode: 'open' });
            const that = {};

            // 为event中的事件绑定this
            const lsnrctlEvent = {};
            Object.entries(event).forEach(([name, fun]) => lsnrctlEvent[name] = fun.bind(that));

            // 代理数据
            let lsnrctlData;
            if (typeof data === 'function'){
                const funData = data(props);
                if (Object.prototype.toString.call(funData) === '[object Object]'){
                    lsnrctlData = funData;
                } else {
                    lsnrctlData = {};
                }
            } else if (Object.prototype.toString.call(data) === '[object Object]'){
                lsnrctlData = data;
            } else {
                lsnrctlData = {};
            }
            lsnrctlData = Lsnrctl.getProxyData(lsnrctlData);

            // 在event事件中的this加入内容
            Object.assign(that, lsnrctlData, lsnrctlEvent);

            // 渲染节点
            const newFragment = fragment.cloneNode(true);
            new Render(newFragment, that);

            // 添加rootStyle
            rootStyleNode && newFragment.appendChild(rootStyleNode.cloneNode(true));

            // 添加style
            const styleStirng = style.trim().replace(/\s+/g, ' ');
            if (styleStirng !== ''){
                const styleDom = document.createElement('style');
                styleDom.innerHTML = styleStirng;
                newFragment.appendChild(styleDom);
            }

            // 挂载节点
            shadow.append(newFragment);
        }
    });
};

export {
    render,
    setRootStyle,
    createComponent,
};
