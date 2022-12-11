import Lsnrctl from './lsnrctl';
import Render from './render';

// rootStyle
let rootStyleNode = null;
const setRootStyle = (styleString) => {
    const rootStyleStirng = styleString.trim().replace(/\s+/g, ' ');
    if (rootStyleStirng !== ''){
        rootStyleNode = document.createElement('style');
        rootStyleNode.innerHTML = rootStyleStirng;
    }
};

// render component or root
const renderFragment = (components = {}, html = '', data = {}, event = {}, style = '', props = {}) => {
    Object.entries(event).forEach(([key, value]) => {
        if (typeof value !== 'function'){
            throw `Compoment的参数event中的${key}应为函数`;
        }
    });
    Object.entries(data).forEach(([key]) => {
        if (event[key]){
            throw `Compoment的参数data和event中不应同时存在${key}值`;
        }
    });

    const fragment = document.createRange().createContextualFragment(html.trim());
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
    new Render(fragment, that, components);

    // 添加rootStyle
    rootStyleNode && fragment.appendChild(rootStyleNode.cloneNode(true));

    // 添加style
    const styleStirng = style.trim().replace(/\s+/g, ' ');
    if (styleStirng !== ''){
        const styleDom = document.createElement('style');
        styleDom.innerHTML = styleStirng;
        fragment.appendChild(styleDom);
    }

    // 返回节点
    return fragment;
};

// const render = ({ root, html, data, event, style }) => {
//     const rootNode = document.querySelector(root);
//     if (!rootNode){
//         console.error('选择器错误:', root);
//         return;
//     }

//     const rootFragment = renderFragment(html, data, event, style, {});

//     setTimeout(() => {
//         rootNode.append(rootFragment);
//     });
// };

const render = (rootSelecter, component) => {
    const root = document.querySelector(rootSelecter);
    if (!root){
        console.error('选择器错误:', rootSelecter);
        return;
    }
    root.append(component);
};

const createComponent = ({ components, html, data, event, style }) => {
    if (typeof name !== 'string'){
        throw 'Compoment的name参数应该存在并为string类型';
    }

    return renderFragment(components, html, data, event, style);

    // customElements.get(name) || customElements.define(name, class extends HTMLElement{
    //     constructor(){
    //         super();
    //         const props = this.retainAttrs || {};
    //         const shadow = this.attachShadow({ mode: 'open' });
    //         shadow.append(renderFragment(html, data, event, style, props));
    //     }
    // });
};

export {
    render,
    setRootStyle,
    createComponent,
};
