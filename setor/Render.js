import Lsnrctl from './Lsnrctl';

/** 是否为手机端 */
const IS_MOBILE = 'ontouchstart' in document;

/** 不会渲染的节点名 */
const IGNORE_RENDER_NODE_NAMES = ['SCRIPT', 'STYLE'];

/** 绑定事件并读取，得到取值函数 */
const funDom = document.createElement('div');

/**
 * @description: 元素数据渲染
 * @author: 李永强
 * @datetime: 2022-12-06 13:03:58
 */
export default class {
    /** 渲染的根元素 */
    root = null;

    /** 渲染数据 */
    data = {};

    dataKeys = [];

    /** 是否已经渲染完成 */
    isRendered = false;
    /** 渲染完成回调函数集 */
    rendered = [];

    /** for循环的数据 */
    forData = {};

    /** if条件集合 */
    ifConditions = [];
    /** 上一个if节点 */
    preIfElement = null;

    /** 节点回调缓存 */
    bufferCallbacks = new Set();

    /**
     * @description: 构造函数
     * @author: 李永强
     * @param {Element} root: 渲染的根节点
     * @param {Object} data: 渲染时使用的数据
     * @datetime: 2022-12-06 13:09:35
     */
    constructor(root, data){
        this.root = root;
        this.data = data;

        this.dataKeys = Object.keys(data);

        // 在html文档加载完成后渲染
        if (window.document.readyState === 'loading'){
            document.addEventListener('DOMContentLoaded', () => {
                this.renderRoot();
            });
        } else {
            this.renderRoot();
        }
    }

    /**
     * @description: 渲染根节点，执行回调函数
     * @author: 李永强
     * @datetime: 2022-12-06 18:01:48
     */
    renderRoot(){
        this.renderNode(this.root);
        this.isRendered = true;
        this.rendered.forEach((call) => call());
    }

    /**
     * @description: 渲染节点和子代节点(普通节点和文本节点分类渲染)
     * @author: 李永强
     * @param {Node} node: 渲染的节点
     * @datetime: 2022-12-06 18:02:35
     */
    renderNode(node){
        const { nodeName } = node;

        // 检查是否为忽略渲染的节点
        if (IGNORE_RENDER_NODE_NAMES.includes(nodeName)) return;

        if (node.nodeName === '#text'){
            this.renderText(node);
        } else {
            // 渲染节点属性
            const breakRender = !!(node.attributes && this.renderAttr(node));
            // 是否选择子代
            if (breakRender) return;
            // 渲染子节点
            node.childNodes && [...node.childNodes].forEach((node) => {
                this.renderNode(node);
            });
        }
    }

    /**
     * @description: 分割文本节点分别渲染
     * @author: 李永强
     * @param {TextNode} node: 文本节点
     * @datetime: 2022-12-06 18:05:57
     */
    renderText(node){
        let match;
        let textNode = node;
        while ((match = textNode.data.match(/\{.*?\}/)) !== null){
            if (match.index !== 0){
                textNode = textNode.splitText(match.index);
            }
            const newNode = textNode.splitText(match[0].length);
            this.renderTextCotnt(textNode, textNode.data.slice(1, -1));
            textNode = newNode;
        }
    }

    /**
     * @description: 将文本内容与数据进行绑定
     * @author: 李永强
     * @param {TextNode} node: 文本节点
     * @param {valueString} string: 获取属性值的执行代码
     * @datetime: 2022-12-06 18:06:58
     */
    renderTextCotnt(node, valueString){
        // 获取属性值函数
        const valueFun = this.getValueFun(valueString);
        // 绑定数据
        this.setLsnrctlCallback(() => {
            const value = valueFun();
            if (typeof value === 'undefined'){
                // 数据不存在时渲染为空
                node.data = '';
            } else if (['object', 'function'].includes(typeof value)){
                // 数据为对象或函数时渲染为JSON字符串
                node.data = JSON.stringify(value);
            } else {
                // 正常渲染值
                node.data = value;
            }
        }, node);
    }

    /**
     * @description: 渲染节点的属性入口函数
     * @author: 李永强
     * @param {Element} node: 渲染的节点
     * @datetime: 2022-12-09 18:11:33
     */
    renderAttr(node){
        const bindAttrs = {};
        const eventAttrs = {};
        const specialAttrs = {};
        const retainAttrs = {};

        // 对属性分类
        node.attributes
            && [...node.attributes].forEach((attr) => {
                const [attrName, ...adorns] = attr.name.split('.');
                if (attrName.length <= 1) return;
                if (attrName[0] === ':'){
                    bindAttrs[attr.name] = [attrName.slice(1), adorns, attr.value];
                } else if (attrName[0] === '@'){
                    eventAttrs[attr.name] = [attrName.slice(1), adorns, attr.value];
                } else if (attrName[0] === '-'){
                    specialAttrs[attr.name] = [attrName.slice(1), adorns, attr.value];
                } else if (attrName[0] === '+'){
                    retainAttrs[attr.name] = [attrName.slice(1), adorns, attr.value];
                }
            });

        // 优先渲染特殊属性并判断是否需要继续渲染
        if (this.renderSpecials(node, specialAttrs)) return true;
        this.renderBinds(node, bindAttrs);
        this.renderEvents(node, eventAttrs);
        this.renderRetains(node, retainAttrs);
    }

    /**
     * @description: 绑定属性渲染入口
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {Object} bindAttrs: 所有的绑定属性原数据
     * @datetime: 2022-12-09 18:13:31
     */
    renderBinds(node, bindAttrs){
        Object.entries(bindAttrs).forEach(([attrAllName, [attrName, adorns, valueString]]) => {
            node.removeAttribute(attrAllName);
            if (['INPUT', 'SELECT'].includes(node.tagName.toUpperCase()) && attrName[0] === ':'){
                // input和select标签的::属性为双向绑定值，::input中input为事件名，可以指名将使用内置默认事件
                this.renderBindForMutual(node, attrName.slice(1), valueString, adorns);
            } else if (attrName === 'class'){
                this.renderBindForClass(node, valueString, adorns);
            } else if (attrName === 'style'){
                this.renderBindForStyle(node, valueString, adorns);
            } else {
                this.renderBindForNormal(node, attrName, valueString, adorns);
            }
        });
    }

    /**
     * @description: 渲染普通绑定属性
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} attrName: 属性名
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 18:16:30
     */
    renderBindForNormal(node, attrName, valueString){
        const valueFun = this.getValueFun(valueString);
        this.setLsnrctlCallback(() => {
            const value = valueFun();
            if (typeof value === 'string'){
                node.setAttribute(attrName, value);
            } else if (attrName.indexOf('data-') === 0){
                node.setAttribute(attrName, value);
            } else {
                node[attrName] = value;
            }
        }, node);
    }

    /**
     * @description: 渲染绑定的class属性
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 18:18:19
     */
    renderBindForClass(node, valueString){
        // 保存标签的class属性
        const { className } = node;
        const valueFun = this.getValueFun(valueString);
        this.setLsnrctlCallback(() => {
            let newClassName = className;
            const value = valueFun();
            if (Object.prototype.toString.call(value) === '[object Object]'){
                // 值为对象时保留值可转为true的键名作为className
                Object.entries(value).forEach(([className, active]) => {
                    active && (newClassName += ` ${className}`);
                });
            } else {
                newClassName += ` ${value}`;
            }
            node.className = newClassName;
        }, node);
    }

    /**
     * @description: 渲染绑定的style属性
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 18:19:14
     */
    renderBindForStyle(node, valueString){
        // 保存标签的style属性
        const style = node.getAttribute('style') || '';
        const valueFun = this.getValueFun(valueString);
        this.setLsnrctlCallback(() => {
            let newStyle = style;
            const value = valueFun();
            if (Object.prototype.toString.call(value) === '[object Object]'){
                // 值为对象时以键值对为style的值和属性
                Object.entries(value).forEach(([styleName, styleValue]) => {
                    if (styleName === 'transform' && Object.prototype.toString.call(styleValue) === '[object Object]'){
                        // transform对应值为对象时将键名最为函数名，值为参数
                        let transform = '';
                        Object.entries(styleValue).forEach(([transName, transValue]) => {
                            transform += `${transName}(${transValue}) `;
                        });
                        newStyle += `${styleName}:${transform};`;
                    } else {
                        newStyle += `${styleName}:${styleValue};`;
                    }
                });
            } else {
                newStyle += value;
            }
            node.setAttribute('style', newStyle);
        }, node);
    }

    /**
     * @description: 渲染双向绑定入口
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} type: 事件名
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 18:24:58
     */
    renderBindForMutual(node, type, valueString){
        const tagName = node.tagName.toUpperCase();
        if (tagName === 'INPUT'){
            this.renderBindForMutualOfInput(node, type, valueString);
        } else if (tagName === 'SELECT'){
            this.renderBindMutualOfSelect(node, type, valueString);
        }
    }

    /**
     * @description: 渲染input标签的双向绑定属性
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} type: 事件名
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 18:30:18
     */
    renderBindForMutualOfInput(node, type, valueString){
        const valueFun = this.getValueFun(valueString);
        /** 属性设置函数，用于回绑指定的数据 */
        let setValueFun = null;
        /** 默认事件 */
        let model = '';

        if (node.type === 'checkbox'){
            // input:checkbox标签
            model = 'change';
            const bindData = valueFun();
            // 标签的value属性为是否选中的标识
            const value = node.getAttribute('value') || node.value;
            if (Object.prototype.toString.call(bindData) === '[object Array]'){
                // 绑定的是一个数组时，数组中存在value值则选中checkbox
                this.setLsnrctlCallback(() => {
                    node.checked = bindData.includes(value);
                }, node);
                // 设置回绑函数
                setValueFun = () => {
                    if (node.checked && !bindData.includes(value)){
                        bindData.push(value);
                    } else if (!node.checked && bindData.includes(value)){
                        const index = bindData.indexOf(value);
                        bindData.splice(index, 1);
                    }
                };
            } else if (Object.prototype.toString.call(bindData) === '[object Object]'){
                // 绑定的是一个对象时，对象的键名为标签value值，键值为是否选中checkbox
                // 标签的value属性为是否选中的标识
                const value = node.getAttribute('value') || node.value;
                this.setLsnrctlCallback(() => {
                    node.checked = bindData[value];
                }, node);
                // 设置回绑函数
                setValueFun = () => {
                    bindData[value] = node.checked;
                };
            } else {
                // 其他的统一为普通值，true和false标记checkbox状态
                // 清空记录值用于记录使用到的value值
                Lsnrctl.recorderValue = null;
                this.setLsnrctlCallback(() => {
                    node.checked = valueFun();
                }, node);
                // 存在记录的值则回绑
                if (Lsnrctl.recorderValue){
                    setValueFun = Lsnrctl.recorderValue.set;
                }
            }
        } else if (node.type === 'radio'){
            // input:radio标签
            model = 'change';
            // 清空记录值用于记录使用到的value值
            Lsnrctl.recorderValue = null;
            this.setLsnrctlCallback(() => {
                node.checked = valueFun() === node.value;
            }, node);
            // 存在记录的值则回绑
            if (Lsnrctl.recorderValue){
                setValueFun = Lsnrctl.recorderValue.set;
            }
        } else {
            // input:其他标签同意绑定一个普通值
            model = 'input';
            // 清空记录值用于记录使用到的value值
            Lsnrctl.recorderValue = null;
            this.setLsnrctlCallback(() => {
                node.value = valueFun();
            }, node);
            // 存在记录的值则回绑
            if (Lsnrctl.recorderValue){
                setValueFun = Lsnrctl.recorderValue.set;
            }
        }

        // 加上事件，没有指定则使用默认事件
        node.addEventListener(type || model, () => {
            setValueFun && setValueFun();
        });
    }

    /**
     * @description: 渲染select标签的双向绑定属性
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} type: 事件名
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 19:04:09
     */
    renderBindForMutualOfSelect(node, type, valueString){
        const valueFun = this.getValueFun(valueString);

        // 清空记录值用于记录使用到的value值
        Lsnrctl.recorderValue = null;
        this.setLsnrctlCallback(() => {
            node.value = valueFun();
        }, node);

        // 存在记录的值则回绑
        if (Lsnrctl.recorderValue){
            const setValueFun = Lsnrctl.recorderValue.set;
            // 加上事件，没有指定则使用默认change事件
            node.addEventListener(type || 'change', () => {
                setValueFun && setValueFun();
            });
        }
    }

    /**
     * @description: 事件绑定入口函数
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {Object} eventAttrs: 所有的事件绑定原数据
     * @datetime: 2022-12-09 19:04:41
     */
    renderEvents(node, eventAttrs){
        Object.entries(eventAttrs).forEach(([attrAllName, [eventType, adorns, valueString]]) => {
            node.removeAttribute(attrAllName);
            // 将内置一些函数，为兼容移动端和pc端
            if (eventType === 'down'){
                this.renderEventForDown(node, valueString, adorns);
            } else if (eventType === 'up'){
                this.renderEventForUp(node, valueString, adorns);
            } else if (eventType === 'clk'){
                this.renderEventForClk(node, valueString, adorns);
            } else if (eventType === 'dbclk'){
                this.renderEventForDbclk(node, valueString, adorns);
            } else if (eventType === 'move'){
                this.renderEventForMove(node, valueString, adorns);
            } else {
                this.renderEventForNormal(node, eventType, valueString, adorns);
            }
        });
    }

    /**
     * @description: 按下事件，pc端为鼠标按下，移动端为手指按下
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @param {Array} adorns: 获取属性值的表达式
     * @datetime: 2022-12-09 19:06:59
     */
    renderEventForDown(node, valueString, adorns){
        if (IS_MOBILE){
            this.renderEventForNormal(node, 'touchstart', valueString, adorns);
        } else {
            this.renderEventForNormal(node, 'mousedown', valueString, adorns);
        }
    }

    /**
     * @description: 松开事件，pc端为鼠标键抬起，移动端为手指抬起
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @param {Array} adorns: 获取属性值的表达式
     * @datetime: 2022-12-09 19:09:32
     */
    renderEventForUp(node, valueString, adorns){
        if (IS_MOBILE){
            this.renderEventForNormal(node, 'touchend', valueString, adorns);
        } else {
            this.renderEventForNormal(node, 'mouseup', valueString, adorns);
        }
    }

    /**
     * @description: 点击事件，pc端为鼠标点击，移动端为手指按下不移动并在150ms内抬起
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @param {Array} adorns: 获取属性值的表达式
     * @datetime: 2022-12-09 19:09:45
     */
    renderEventForClk(node, valueString, adorns){
        if (IS_MOBILE){
            const valueFun = this.getValueFun(valueString);
            let isMove = true;
            let startTime = 0;
            this.renderEventForNormal(node, 'touchstart', () => {
                isMove = false;
                startTime = Date.now();
            }, adorns);
            this.renderEventForNormal(node, 'touchmove', () => {
                isMove = true;
            });
            this.renderEventForNormal(node, 'touchend', () => {
                Date.now() - startTime <= 150 && !isMove && valueFun();
            }, adorns);
        } else {
            this.renderEventForNormal(node, 'click', valueString, adorns);
        }
    }

    /**
     * @description: 双击事件，pc端为鼠标双击，移动端为手指按下不移动并在500ms内抬起
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @param {Array} adorns: 获取属性值的表达式
     * @datetime: 2022-12-09 19:12:45
     */
    renderEventForDbclk(node, valueString, adorns){
        if (IS_MOBILE){
            const valueFun = this.getValueFun(valueString);
            let clickCount = 0;
            let isDbclickTimeoutId = 0;
            this.renderEventForNormal(node, 'touchstart', (event) => {
                event.preventDefault();
                event.returnValue = false;
                clickCount++;
                if (clickCount === 1){
                    isDbclickTimeoutId = setTimeout(() => {
                        clickCount = 0;
                    }, 500);
                }
            }, adorns);
            this.renderEventForNormal(node, 'touchend', (event) => {
                event.preventDefault();
                event.returnValue = false;
                clickCount++;
                if (clickCount === 1){
                    clickCount = 0;
                } else if (clickCount === 4){
                    clearTimeout(isDbclickTimeoutId);
                    clickCount = 0;
                    valueFun(event);
                }
            }, adorns);
        } else {
            this.renderEventForNormal(node, 'dbclick', valueString, adorns);
        }
    }

    /**
     * @description: 移动事件，pc端为鼠标移动，移动端为手指触摸移动
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @param {Array} adorns: 获取属性值的表达式
     * @datetime: 2022-12-09 19:12:45
     */
    renderEventForMove(node, valueString, adorns){
        if (IS_MOBILE){
            const valueFun = this.getValueFun(valueString);
            let clickCount = 0;
            let isDbclickTimeoutId = 0;
            this.renderEventForNormal(node, 'touchstart', (event) => {
                event.preventDefault();
                event.returnValue = false;
                clickCount++;
                if (clickCount === 1){
                    isDbclickTimeoutId = setTimeout(() => {
                        clickCount = 0;
                    }, 500);
                }
            }, adorns);
            this.renderEventForNormal(node, 'touchend', (event) => {
                event.preventDefault();
                event.returnValue = false;
                clickCount++;
                if (clickCount === 1){
                    clickCount = 0;
                } else if (clickCount === 4){
                    clearTimeout(isDbclickTimeoutId);
                    clickCount = 0;
                    valueFun(event);
                }
                return false;
            }, adorns);
        } else {
            this.renderEventForNormal(node, 'dbclick', valueString, adorns);
        }
    }

    /**
     * @description: 移动事件，pc端为鼠标移动，移动端为手指触摸移动
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} eventType: 事件类型
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 19:32:18
     */
    renderEventForNormal(node, eventType, valueString){
        const valueFun = this.getValueFun(valueString)();
        node.addEventListener(eventType, valueFun);
    }

    /**
     * @description: 特殊属性绑定入口函数
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {Object} specialAttrs: 所有的特色属性原数据
     * @datetime: 2022-12-09 19:34:12
     */
    renderSpecials(node, specialAttrs){
        Object.entries(specialAttrs).forEach(([attrAllName, [attrName, adorns, valueString]]) => {
            node.removeAttribute(attrAllName);
            
            // 是否断开渲染
            let breakRender = false;
            if (attrName === 'for'){
                breakRender = this.renderSpecialForFor(node, valueString, adorns);
            } else if (attrName === 'if'){
                breakRender = this.renderSpecialForIf(node, valueString, adorns);
            } else if (attrName === 'elif'){
                breakRender = this.renderSpecialForElif(node, valueString, adorns);
            } else if (attrName === 'else'){
                breakRender = this.renderSpecialForElse(node, adorns);
            } else if (attrName === 'show'){
                breakRender = this.renderSpecialForShow(node, valueString, adorns);
            }

            if (breakRender) return true;
        });
    }

    /**
     * @description: 渲染for属性（循环属性：-for="v,k in data"）可以省略k值
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2022-12-09 19:39:35
     */
    renderSpecialForFor(node, valueString){
        const [vkString, forDataString] = valueString.split(' in ');
        const [vString, kString] = vkString.split(',');

        const forAnchor = document.createComment('render.for');
        node.parentNode.insertBefore(forAnchor, node);
        node.parentNode.removeChild(node);

        const getForDataFun = this.getValueFun(forDataString);
        const forNodes = [];
        let forData;

        this.setLsnrctlCallback(() => {
            forData = getForDataFun();
            const isNumberFor = typeof forData === 'number';
            const dataLength = isNumberFor ? forData : forData.length;

            Lsnrctl.callback = null;
            if (dataLength > forNodes.length){
                for (let index = forNodes.length; index < dataLength; index++){
                    this.forKeys.push(vString);
                    if (isNumberFor){
                        this.forValues.push(() => index);
                    } else if (typeof forData[index] == 'object'){
                        // eslint-disable-next-line no-loop-func
                        this.forValues.push(() => forData[index]);
                    } else {
                        // eslint-disable-next-line no-loop-func
                        this.forValues.push(() => ({
                            get value(){
                                return forData[index];
                            },
                            set value(value){
                                forData[index] = value;
                            },
                        }));
                    }
                    if (kString){
                        this.forKeys.push(kString);
                        this.forValues.push(() => index);
                    }

                    const cloneNode = node.cloneNode(true);
                    forNodes.push(cloneNode);
                    forAnchor.parentNode.insertBefore(cloneNode, forAnchor);
                    this.renderNode(cloneNode);

                    this.forKeys.pop();
                    this.forValues.pop();
                    if (kString){
                        this.forKeys.pop();
                        this.forValues.pop();
                    }
                }
            } else if (dataLength < forNodes.length){
                for (let index = dataLength; index < forNodes.length; index++){
                    forNodes[index].parentNode.removeChild(forNodes[index]);
                }
                forNodes.length = dataLength;
            }
        }, node);
        return true;
    }

    /**
     * @description: 渲染-if属性，当表达式值为真时渲染
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2023-01-12 15:02:45
     */
    renderSpecialForIf(node, valueString) {
        const valueFun = this.getValueFun(valueString);

        // 生成锚点
        const ifAnchor = document.createComment('if');
        node.parentNode.insertBefore(ifAnchor, node);

        // 记录if值函数和节点，方便elif和else属性渲染
        this.ifConditions = [valueFun];
        this.preIfElement = [node, ifAnchor];

        this.setLsnrctlCallback(() => {
            if (valueFun()){
                ifAnchor.parentNode.insertBefore(node, ifAnchor);
            } else {
                node.parentNode && node.parentNode.removeChild(node);
            }
        }, node);
    }


    /**
     * @description: 渲染-elif属性，当之前表达式值都为假且当前表达式值为真时渲染
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2023-01-12 15:08:46
     */
    renderSpecialForElif(node, valueString){
        const valueFun = this.getValueFun(valueString);

        // 查看节点前一个节点是否为判断节点
        let { previousSibling } = node;
        while (previousSibling.nodeName == '#text') previousSibling = previousSibling.previousSibling;
        if (!previousSibling || !this.preIfElement.includes(previousSibling)) {
            console.error('-elif属性节点位置错误', node);
            return;
        };

        // 生成锚点
        const elifAnchor = document.createComment('elif');
        node.parentNode.insertBefore(elifAnchor, node);

        // 保存判断函数队列，记录if值函数和节点，方便elif和else属性渲染
        const ifConditions = [...this.ifConditions];
        this.ifConditions.push(valueFun);
        this.preIfElement = [node, elifAnchor];

        this.setLsnrctlCallback(() => {
            // 如果之前的判断函数中有真，那么隐藏当前节点。之前判断函数都为假并且当前判断函数为真则显示节点
            if (ifConditions.find((condition) => condition()) || !valueFun()) {
                node.parentNode && node.parentNode.removeChild(node);
            } else {
                elifAnchor.parentNode.insertBefore(node, elifAnchor);
            }
        }, node);
    }

    /**
     * @description: 渲染-else属性，当之前表达式值都为假时渲染
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2023-01-12 15:18:35
     */
    renderSpecialForElse(node){
        // 查看节点前一个节点是否为判断节点
        let { previousSibling } = node;
        while (previousSibling.nodeName == '#text') previousSibling = previousSibling.previousSibling;
        if (!previousSibling || !this.preIfElement.includes(previousSibling)) {
            console.error('-else属性节点位置错误', node);
            return;
        };

        // 生成锚点
        const elseAnchor = document.createComment('elif');
        node.parentNode.insertBefore(elseAnchor, node);

        // 保存判断函数队列，清空if值函数和节点
        const ifConditions = [...this.ifConditions];
        this.ifConditions = [];
        this.preIfElement = null;

        this.setLsnrctlCallback(() => {
            // 如果之前的判断函数中有真，那么隐藏当前节点。之前判断函数都为假则显示节点
            if (ifConditions.find((condition) => condition())) {
                node.parentNode && node.parentNode.removeChild(node);
            } else {
                elseAnchor.parentNode.insertBefore(node, elseAnchor);
            }
        }, node);
    }

    /**
     * @description: 渲染-show属性，当表达式值都为真时显示
     * @author: 李永强
     * @param {Element} node: 渲染的标签
     * @param {string} valueString: 获取属性值的表达式
     * @datetime: 2023-01-12 16:44:10
     */
    renderSpecialForShow(node, valueString){
        const valueFun = this.getValueFun(valueString);

        // 获取display默认值
        const { display } = node.style;

        this.setLsnrctlCallback(() => {
            if (valueFun()) {
                node.style.display = display;
            } else {
                node.style.display = 'none';
            }
        }, node);
    }

    // specialRetains
    renderRetains(node, retainAttrs){
        if (Object.prototype.toString.call(node.retainAttrs) !== '[object Object]'){
            node.retainAttrs = {};
        }
        Object.entries(retainAttrs).forEach(([attrAllName, [attrName, adorns, valueString]]) => {
            adorns;
            node.retainAttrs[attrName] = this.getValueFun(valueString)();
            node.removeAttribute(attrAllName);
        });
    }

    /**
     * @description: 在节点存在于文档中时执行监听回调函数
     * @author: 李永强
     * @param {function} callback: 回调函数
     * @param {node} node: 当前作用的节点
     * @datetime: 2023-01-12 16:51:19
     */
    setLsnrctlCallback(callback, node) {
        Lsnrctl.callback = () => {
            const { bufferCallbacks } = this;
            if (document.contains(this.root)) {
                if (bufferCallbacks.size) {
                    bufferCallbacks.forEach((callback) => callback());
                    bufferCallbacks.clear();
                }
                callback();
            } else {
                bufferCallbacks.add(callback);
            }
        }
        callback();
        Lsnrctl.callback = null;
    }

    /**
     * @description: 根据表达式字符串通过标签的事件属性获取取值函数
     * @author: 李永强
     * @param {string} valueString: 取值表达式
     * @return {function}: 取值函数
     * @datetime: 2023-01-12 16:49:55
     */
    getValueFun(valueString) {
        funDom.setAttribute('onclick', `return ({${this.dataKeys.join(',')}}, {${Object.keys(this.forData).join(',')}}) => ${valueString || 'undefined'}`);
        return funDom.onclick().bind(window, this.data, this.forData);
    }
}
