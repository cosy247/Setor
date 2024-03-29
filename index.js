import Lsnrctl from './Lsnrctl';
import Render from './Render';

/** 样式添加结点 */
const styleDom = document.createElement('style');
document.head.appendChild(styleDom);

/**
 * @description: 渲染根节点
 * @param {string} object.root: 根节点选择器
 * @param {string} object.component: 根节点挂载的组件名
 * @param {undefined | string} object.style: 全局样式
 * @datetime: 2022-12-14 17:36:23
 */
const createApp = ({root, component}) => {
    const rootComponent = document.createElement(component);
    root.appendChild(rootComponent);
    new Render(root, {});
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
const createComponent = ({ name, html, getValueFunFunctory }) => {
    // 检查组件是否被定义了
    if (customElements.get(name)) return;

    // 更正组件名
    if(!name.includes('-')) {
        console.error(`组件名称中必须包含横线符号：${name}`);
        return;
    }

    console.log(name,html);

    // const contentRoot = document.createRange().createContextualFragment(html);
    // 处理组件标签重命名和自闭和标签
    // const filterHtml = html
    //     .trim()
    //     .replace(/((?<=<\s?)[A-Z](?=(.*?)\b[^>]*\/?>)|(?<=<\s?\/\s?)[A-Z](?=(.*?)\b[^>]*>))/g, (name) => `app-${name.toLowerCase()}`)
    //     .replace(/<\s?[^\/]\s?(.*?)\b[^>]*>/g, (tagStart) => {
    //         return tagStart.replace(/[a-zA-Z]*\s?=\s?('|").*?\1/g, (attr) => {
    //             const [name, ...value] = attr.split('=');
    //             return `${name.replace(/[A-Z]/g, (char) => `_${char.toUpperCase()}`)}=${value.join('=')}`;
    //         });
    //     });

    // 定义组件
    customElements.define(
        name,
        class extends HTMLElement {
            connectedCallback() {
                // 创建内容节点
                const contentRoot = document.createRange().createContextualFragment(html);
                
                new Render(contentRoot, getValueFunFunctory());

                // 替换节点
                this.parentNode.replaceChild(contentRoot, this);
            }
        }
    );
};

/** store接口对象 */
const store = ((storeData) => ({
    /**
     * @description: 初始化storeData数据
     * @author: 李永强
     * @param {object} data: 数据
     * @datetime: 2023-01-13 11:37:36
     */
    init(data) {
        Object.entries(data).forEach(([key, value]) => {
            storeData[key] = value;
        });

        delete this.init;
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

/** router接口对象 */
const router = (() => {
    /** 当前路由显示的节点标识 */
    let currentRouterNodes = [];
    /** 路由与节点的映射关系 */
    const hashEvents = {};
    /** 路由路径 */
    const path = Lsnrctl.getProxyData([]);
    /** 路由显性参数 */
    const query = Lsnrctl.getProxyData({});
    /** 路由隐性参数 */
    const params = Lsnrctl.getProxyData({});

    // 初始话数据
    {
        /** 当前hash */
        const hash = (location.href.match(/(?<=#\/).*?(?=(\?|$))/) || [''])[0];

        // 获取显性路由参数
        const newQuery = (location.href.split('?')[1] || '').split('&').reduce((newQuery, paramStr) => {
            const [key, value] = paramStr.split('=');
            newQuery[key] = value;
            return newQuery;
        }, {});

        // 设置显性路由参数
        Object.entries(newQuery).forEach(([key, value]) => {
            query[key] = newQuery[key];
        });

        // 设置路径参数
        const newPath = hash.split('/');
        path.push(...newPath);
    }

    // 监听路由变化
    window.addEventListener('hashchange', (e) => {
        const newHash = `${(e.newURL.match(/(?<=#\/).*?(?=(\?|$))/) || [''])[0]}/`;
        const oldHash = `${(e.oldURL.match(/(?<=#\/).*?(?=(\?|$))/) || [''])[0]}/`;

        // 获取显性路由参数
        const newQuery = (e.newURL.split('?')[1] || '').split('&').reduce((newQuery, paramStr) => {
            const [key, value] = paramStr.split('=');
            newQuery[key] = value;
            return newQuery;
        }, {});

        // 更新显性路由参数
        Object.entries(query).forEach(([key, value]) => {
            if (!newQuery.hasOwnProperty(key)) {
                delete query[key];
            } else if (value !== newQuery[key]) {
                query[key] = newQuery[key];
            }
        });
        Object.entries(newQuery).forEach(([key, value]) => {
            if (!query.hasOwnProperty(key)) {
                query[key] = newQuery[key];
            }
        });

        // 路由没有不处理
        if (newHash === oldHash) {
            return;
        }

        // 更新路径
        const newPath = newHash.split('/').slice(0, -1);
        newPath &&
            newPath.forEach((pt, index) => {
                pt != path[index] && (path[index] = pt);
            });
        path.length = newPath.length;

        // 获取当前路由需要展示的节点
        const newRouterNodes = Object.entries(hashEvents).reduce((newRouterNodes, [path, routerNodes]) => {
            if (newHash.indexOf(path) == 0) {
                newRouterNodes.push(...routerNodes);
            }
            return newRouterNodes;
        }, []);

        // 展示新的节点
        newRouterNodes.forEach((routerNode) => {
            if (!currentRouterNodes.includes(routerNode)) {
                if (!routerNode.isRendered) {
                    new Render(routerNode.routerRoot, routerNode.data);
                    routerNode.isRendered = true;
                }
                routerNode.routerAnchor.parentNode.insertBefore(routerNode.routerRoot, routerNode.routerAnchor);
            }
        });

        // 移除不在当前路由的节点
        currentRouterNodes.forEach((routerNode) => {
            if (!newRouterNodes.includes(routerNode)) {
                routerNode.routerRoot.parentNode.removeChild(routerNode.routerRoot);
            }
        });

        // 更新当前路由显示的节点标识
        currentRouterNodes = newRouterNodes;
    });

    // 定义router组件
    customElements.define(
        'app-router',
        class extends HTMLElement {
            constructor() {
                super();

                // 获取path
                const path = `${this.getAttribute('path')}/` || '/';
                this.removeAttribute('path');

                // 创建锚点
                const routerAnchor = document.createComment('router');
                this.parentNode.insertBefore(routerAnchor, this);
                this.parentNode.removeChild(this);

                // 创建router根节点
                const routerRoot = document.createElement('div');
                const fragment = document.createRange().createContextualFragment(this.innerHTML.trim());
                routerRoot.appendChild(fragment);
                [...this.attributes].forEach(({ name, value }) => routerRoot.setAttribute(name, value));

                // 节点标识
                const routerNodes = {
                    routerAnchor,
                    routerRoot,
                    data: currentComponentData,
                    isRendered: false,
                };

                // 判断当前路由
                const route = `${(location.hash.match(/(?<=#\/).*?(?=(\?|$))/) || [''])[0]}/`;
                if (route.indexOf(path) == 0) {
                    routerAnchor.parentNode.insertBefore(routerRoot, routerAnchor);
                    routerNodes.isRendered = true;
                    currentRouterNodes.push(routerNodes);
                }

                // 添加到监听中
                hashEvents.hasOwnProperty(path) || (hashEvents[path] = []);
                hashEvents[path].push(routerNodes);
            }
        }
    );

    /**
     * @description: 跳转路由
     * @author: 李永强
     * @param {string} hash: 新的路由
     * @param {object} query: 显性路由参数
     * @param {object} params: 隐性路由参数
     * @datetime: 2023-01-18 16:53:47
     */
    const to = ({ path, query, params: newParams }) => {
        // const queryString = istype(query, 'Object')
        //     ? `?${Object.entries(query)
        //           .map(([key, value]) => `${key}=${value}`)
        //           .join('&')}`
        //     : '';
        // location.hash = `#/${path}${queryString}`;

        // // 更新隐形路由参数
        // istype(params, 'Object') &&
        //     Object.entries(params).forEach(([key, value]) => {
        //         if (!newParams.hasOwnProperty(key)) {
        //             delete params[key];
        //         } else if (value !== newParams[key]) {
        //             params[key] = newParams[key];
        //         }
        //     });
        // istype(newParams, 'Object') &&
        //     Object.entries(newParams).forEach(([key, value]) => {
        //         if (!params.hasOwnProperty(key)) {
        //             params[key] = newParams[key];
        //         }
        //     });
    };

    return {
        query,
        params,
        path,
        to,
    };
})();

export { createApp, createComponent, store, router };
