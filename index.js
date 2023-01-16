import Lsnrctl from './Lsnrctl';
import Render from './Render';
import uilt from './uilt';

const { istype } = uilt;

/** 样式添加结点 */
const styleDom = document.createElement('style');
document.head.appendChild(styleDom);

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
    if (!istype(root, 'string')) {
        console.error('render的root参数应该存在并为string类型');
        return;
    }
    if (!istype(component, 'string')) {
        console.error('render的component参数应该存在并为string类型');
        return;
    }
    if (!istype(style, 'String', 'Undefined')) {
        console.error('render的style参数存在时应为string类型');
        return;
    }

    const rootNode = document.querySelector(root);
    if (!rootNode) {
        console.error(`无法获取到元素: ${root}`);
        return;
    }

    if (style) {
        styleDom.innerHTML += style.replace(/\s+/, ' ');
    }

    setTimeout(() => {
        rootNode.innerHTML = `<${component}></${component}>`;
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
const createComponent = ({ name, html = '', data = () => {}, style = '' }) => {
    // 参数类型判断
    if (!istype(name, 'string')) {
        console.error('Compoment的name参数应该存在并为string类型');
        return;
    }
    if (!istype(html, 'string')) {
        console.error('Compoment的html参数应该存在并为string类型');
        return;
    }
    if (!istype(data, 'function')) {
        console.error('Compoment的data参数应为 object 或 () => object 类型');
        return;
    }
    if (!istype(style, 'string')) {
        console.error('Compoment的style参数应该存在并为string类型');
        return;
    }

    // 检查组件是否被定义了
    if (customElements.get(name)) return;

    // 添加style
    if (style) {
        styleDom.innerHTML += style.replace(/\s+/g, ' ');
    }

    // 处理html代码的自闭和标签
    const fragment = document.createRange().createContextualFragment(html.trim());

    // 定义组件
    customElements.define(
        name,
        class extends HTMLElement {
            connectedCallback() {
                const shadow = this.attachShadow({ mode: 'closed' });

                // 代理数据
                const mapIndex = dataMap.length;
                const lsnrctlData = {};
                dataMap.push(lsnrctlData);
                propsMap.push(this.retainAttrs || {});
                data.call(mapIndex);

                // 渲染节点
                const newFragment = fragment.cloneNode(true);
                new Render(newFragment, lsnrctlData);

                // 替换节点
                this.parentNode.insertBefore(newFragment, this);
                this.parentNode.removeChild(this);
            }
        }
    );
};

/** 保存各个data的映射 */
const dataMap = [];

/**
 * @description: 获取组件渲染的data对象
 * @author: 李永强
 * @param {number} dataIndex: 映射下标，将以this传入组件函数中
 * @return {object}: 组件的渲染data
 * @datetime: 2023-01-13 11:17:37
 */
const getData = (dataIndex) => dataMap[dataIndex];

/** 保存各个props映射 */
const propsMap = [];

/**
 * @description: 获取组件渲的props对象
 * @author: 李永强
 * @param {number} propsIndex: 映射下标，将以this传入组件函数中
 * @return {object}: 组件的props
 * @datetime: 2023-01-13 11:24:25
 */
const getProps = (propsIndex) => propsMap[propsIndex];

/**
 * @description: 监听数据
 * @author: 李永强
 * @param {any} data: 需要监听的数据
 * @return {proxy}: 监听处理后的数据
 * @datetime: 2022-12-29 14:39:41
 */
const bind = Lsnrctl.getProxyData;

/** store接口对象 */
const store = ((storeData) => ({
    /**
     * @description: 初始化storeData数据
     * @author: 李永强
     * @param {object} data: 数据
     * @datetime: 2023-01-13 11:37:36
     */
    init(data) {
        if (!istype(data, 'Object')) {
            console.error(`store.init参数应为简单对象`);
            return;
        }

        if (Object.keys(storeData) !== 0) {
            console.error(`storeData已被初始化`);
            return;
        }

        Object.entries(data).forEach(([key, value]) => {
            storeData[key] = value;
        });
    },

    /**
     * @description: 设置storeData指定数据
     * @author: 李永强
     * @param {string} key: 设置的键名
     * @param {any} value: 设置的值
     * @datetime: 2023-01-13 11:35:00
     */
    set(key, value) {
        if (storeData.hasOwnProperty(key)) {
            storeData[key] = value;
        } else {
            console.error(`storeData中不存在[${key}]指定的值`);
        }
    },

    /**
     * @description: 获取storeData指定数据
     * @author: 李永强
     * @param {string} key: 获取值的键名
     * @datetime: 2023-01-13 11:37:41
     */
    get(key) {
        if (storeData.hasOwnProperty(key)) {
            return storeData[key];
        }
    },
}))(Lsnrctl.getProxyData({}));

// 定义app-router组件
{
    const hashEvents = new Set();
    window.addEventListener('hashchange', () => {
        const { hash } = location;
        hashEvents.forEach((callback) => callback(hash));
    });

    // 定义router组件
    customElements.define(
        'app-router',
        class extends HTMLElement {
            connectedCallback() {
                // 创建锚点
                const routerAnchor = document.createComment('if');

                //

                this.parentNode.removeChild(this);
                
                // 在内存中创建节点
                const fragment = document.createRange().createContextualFragment(this.innerHTML.trim())

                // const componentName = this.getAttribute('component');
                // const path = `#${this.getAttribute('path')}` || '#';
                // console.log(path);
                // const { hash } = location;

                // if (path === hash) {
                //     this.innerHTML = `<${componentName}></${componentName}>`;
                // }

                // hashEvents.add((hash) => {
                //     if (path === hash) {
                //         this.innerHTML = `<${componentName}></${componentName}>`;
                //     } else {
                //         this.innerHTML = '';
                //     }
                // });
            }
        }
    );
}

export { render, createComponent, getData, getProps, bind, store };
