import Lsnrctl from './lsnrctl';
import Render from './render';

/** 全局style标签 */
let rootStyleNode = null;

/** 暂存组件的props属性 */
let props = {};

/** 共享数据store */
let store = {};

/**
 * @description: 判断数据是否为指定的类型之一
 * @author: 李永强
 * @param {any} data: 需要判断的数据
 * @param {string} types: 数据类型
 * @return {boolean}: 是否是指定的类型之一
 * @datetime: 2022-12-29 12:24:05
 */
const istype = (data, ...types) => {
    const dataType = Object.prototype.toString.call(data).slice(8, -1)
        .toUpperCase();
    return types.some((type) => type.toUpperCase() === dataType);
};

const setStore = (data) => {
    if (istype(data, 'Object')){
        store = Lsnrctl.getProxyData(data);
    } else {
        console.error('store应该为简单object类型');
    }
};

/**
 * @description: 渲染根节点
 * @author: 李永强
 * @param {string} object.root: 根节点选择器
 * @param {string} object.component: 根节点挂载的组件名
 * @param {undefined | string} object.style: 全局样式
 * @datetime: 2022-12-14 17:36:23
 */
const render = ({ root, component, style }) => {
    // 参数类型判断
    if (!istype(root, 'string')){
        console.error('render的root参数应该存在并为string类型');
        return;
    }
    if (!istype(component, 'string')){
        console.error('render的component参数应该存在并为string类型');
        return;
    }
    if (!istype(style, 'String', 'Undefined')){
        console.error('render的style参数存在时应为string类型');
        return;
    }

    const rootNode = document.querySelector(root);
    if (!rootNode){
        console.error(`无法获取到元素: ${root}`);
        return;
    }

    if (style){
        const styleStirng = style.trim().replace(/\s+/g, ' ');
        if (styleStirng !== ''){
            rootStyleNode = document.createElement('style');
            rootStyleNode.innerHTML = styleStirng;
            rootStyleNode.setAttribute('name', 'root-style');
            document.head.appendChild(rootStyleNode);
        }
    }

    const appRootComponent = document.createElement(component);
    setTimeout(() => {
        rootNode.innerHTML = '';
        rootNode.append(appRootComponent);
    });
};

/**
 * @description: 创建组件
 * @author: 李永强
 * @param {string} object.name: 组件名
 * @param {undefined | string} object.html: 标签文本
 * @param {undefined | object | ()=>object} object.data: 数据
 * @param {undefined | string} object.style: 样式文本
 * @datetime: 2022-12-14 17:37:43
 */
const createComponent = ({ name, html = '', data = {}, style = '' }) => {
    // 参数类型判断
    if (!istype(name, 'string')){
        console.error('Compoment的name参数应该存在并为string类型');
        return;
    }
    if (!istype(html, 'string')){
        console.error('Compoment的html参数应该存在并为string类型');
        return;
    }
    if (!istype(data, 'object', 'function')){
        console.error('Compoment的data参数应为 object 或 () => object 类型');
        return;
    }
    if (!istype(style, 'string')){
        console.error('Compoment的style参数应该存在并为string类型');
        return;
    }

    // 检查组件是否被定义了
    if (customElements.get(name)) return;

    // 处理html代码的自闭和标签
    const closureHtml = html.trim().replace(/<(?:(?!\/>).|\n)*?\/>/gm, (res) => `${res.slice(0, -2)}></${res.slice(1, res.search(/ |[\\/>]/))}>`);
    const fragment = document.createRange().createContextualFragment(closureHtml);

    // 定义组件
    customElements.define(name, class extends HTMLElement{
        connectedCallback(){
            const shadow = this.attachShadow({ mode: 'open' });

            // 代理数据
            let lsnrctlData;
            if (istype(data, 'Function')){
                props = this.retainAttrs || {};
                const funData = data();
                delete this.retainAttrs;
                props = null;
                if (istype(funData, 'Object')){
                    lsnrctlData = Lsnrctl.getProxyData(funData);
                }  else {
                    console.error('Compoment的data为函数时应该返回一个简单object');
                    return;
                }
            } else {
                lsnrctlData = Lsnrctl.getProxyData(data);
            }

            // 渲染节点
            const newFragment = fragment.cloneNode(true);
            new Render(newFragment, lsnrctlData);

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

/**
 * @description: 监听数据
 * @author: 李永强
 * @param {any} data: 需要监听的数据
 * @return {proxy}: 监听处理后的数据
 * @datetime: 2022-12-29 14:39:41
 */
const bind = (data) => Lsnrctl.getProxyData(data);

/**
 * @description: 获取当前组件的props
 * @author: 李永强
 * @return {object}: 当前缓存的props
 * @datetime: 2022-12-29 15:02:19
 */
const getProps = () => props;

export {
    render,
    createComponent,
    getProps,
    bind,
    setStore,
    store,
};
