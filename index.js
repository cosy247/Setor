import Lsnrctl from './lsnrctl';
import Render from './render';
import { istype, output } from './utils';

/** 全局style标签 */
let rootStyleNode = null;

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
        output.error('render的root参数应该存在并为string类型');
        return;
    }
    if (!istype(component, 'string')){
        output.error('render的component参数应该存在并为string类型');
        return;
    }
    if (!istype(style, 'String', 'Undefined')){
        output.error('render的style参数存在时应为string类型');
        return;
    }

    const rootNode = document.querySelector(root);
    if (!rootNode){
        output.error(`无法获取到元素: ${root}`);
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
        output.error('Compoment的name参数应该存在并为string类型');
        return;
    }
    if (!istype(html, 'string')){
        output.error('Compoment的html参数应该存在并为string类型');
        return;
    }
    if (!istype(data, 'object', 'function')){
        output.error('Compoment的data参数应为 object 或 () => object 类型');
        return;
    }
    if (!istype(style, 'string')){
        output.error('Compoment的style参数应该存在并为string类型');
        return;
    }

    // 检查组件是否被定义了
    if (customElements.get(name)) return;

    // 处理html代码的自闭和标签
    const closureHtml = html.trim().replace(/<(?:(?!\/>).|\n)*?\/>/gm, (res) => `${res.slice(0, -2)}></${res.slice(1, res.search(/ |[\\/>]/))}>`);
    const fragment = document.createRange().createContextualFragment(closureHtml);

    // 定义组件
    customElements.define(name, class extends HTMLElement{
        constructor(){
            super();
            const props = this.retainAttrs || {};
            const shadow = this.attachShadow({ mode: 'open' });
            const that = {};

            // 代理数据
            if (istype(data, 'Function')){
                const funData = data(props);
                if (istype(funData, 'Object')){
                    Lsnrctl.getProxyData(funData);
                }  else {
                    output.error('Compoment的data为函数时应该返回一个简单object');
                    return;
                }
            } else {
                Lsnrctl.getProxyData(data);
            }

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
    createComponent,
};
