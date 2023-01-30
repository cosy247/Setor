/**
 * @description: 数据监听回调处理
 * @author: 李永强
 * @datetime: 2022-12-06 13:03:21
 */
const Lsnrctl = {
    /** 当前数据改变回调函数 */
    callback: null,
    /** 是否在执行回调函数中 */
    isCalling: false,

    /** 数据刷新回调函数集 */
    refreshCalls: new Set(),
    /** 是否为自动刷新 */
    autoRefresh: true,

    /** 添加数据属性值判断是否被代理 */
    proxySymbol: Symbol('isProxy'),

    /** 在一次绑定中第一次使用到的数据，用于表单控件的数据双向绑定 */
    recorderValue: null,

    /**
     * @description: 获取proxy代理的handler
     * @author: 李永强
     * @param {object} callbacks: 回调函数集
     * data: {           callbacks : {
     *   a: 1,             'a': [callbacks],
     *   b: {              'b': [callbacks],
     *     c: 2,           'b.c': [callbacks],
     *     d: 3            'b.d': [callbacks]
     *   }               }
     * }
     * @return {object}: proxy代理的handler
     * @datetime: 2022-12-05 10:25:31
     */
    getProxyHandler(callbacks = {}, callbackKey = 'data'){
        return {
            // 获取属性时对属性和回调函数进行绑定
            get: (target, key, receiver) => {
                // 为数据绑定变化后的回调函数
                if (typeof key !== 'symbol' && Lsnrctl.callback){
                    const allCallbackKey = `${callbackKey}.${key}`;
                    if (!callbacks[allCallbackKey]){
                        callbacks[allCallbackKey] = new Set();
                    }
                    callbacks[allCallbackKey].add(Lsnrctl.callback);
                }

                // recorderValue清空后记录一次，记录第一次使用到的值
                Lsnrctl.recorderValue
                    || (Lsnrctl.recorderValue = {
                        set(value){
                            Reflect.set(target, key, value, receiver);
                            Lsnrctl.handCalls(callbacks, `${callbackKey}.${key}`);
                        },
                    });

                // 获取value并处理（只处理对象自身的非symbol属性的对象值）
                let value = Reflect.get(target, key, receiver);
                if (typeof key !== 'symbol' && Object.hasOwn(target, key)){
                    if (Object.prototype.toString.call(value) === '[object Object]' && !Object.hasOwn(value, Lsnrctl.proxySymbol)){
                        // 渲染为proxy监听对象，添加symbol值作为标识
                        value = new Proxy(value, Lsnrctl.getProxyHandler(callbacks, `${callbackKey}.${key}`));
                        Reflect.set(target, key, value, receiver);
                        value[Lsnrctl.proxySymbol] = true;
                    }
                }

                return value;
            },

            // 设置属性并执行回调
            set: (target, key, newValue, receiver) => {
                console.log(callbacks);
                // 属性值没有改变时不处理（length作为数组长度时无法监听到是否改变，获取得总是最新的，需要特殊处理）
                if (Reflect.get(target, key, receiver) === newValue && key !== 'length') return true;
                // 设置属性值
                const reflect = Reflect.set(target, key, newValue, receiver);
                // 只对不是symbol的属性进行回调执行
                if (typeof key !== 'symbol'){
                    Lsnrctl.handCalls(callbacks, `${callbackKey}.${key}`);
                }
                return reflect;
            },

            // 删除属性，和设置属性类似
            deleteProperty(target, key, receiver){
                const reflect = Reflect.deleteProperty(target, key, receiver);
                if (typeof key !== 'symbol' && Reflect.has(target, key, receiver)){
                    Lsnrctl.handCalls(callbacks, `${callbackKey}.${key}`);
                }
                return reflect;
            },
        };
    },

    /**
     * @description: 处理数据绑定的函数回调，键为a.b时将执行a
     * @author: 李永强
     * @param {object} callbacks: 回调函数映射
     * @param {string} callbackKey: 回调函数映射键
     * @datetime: 2022-12-05 19:01:37
     */
    handCalls(callbacks, callbackKey){
        // 创建锁，防止无限回调；在执行回调时改变值将不再引起回调
        if (Lsnrctl.isCalling) return;
        Lsnrctl.isCalling = true;

        // 获取需要执行的回调函数（callbacksArray为二维数组）
        const callbacksArray = [];
        Object.entries(callbacks).forEach(([cbKey, calls]) => {
            if (cbKey.indexOf(callbackKey) === 0){
                callbacksArray.push(...calls);
            }
        });

        // 是否自动更新
        if (Lsnrctl.autoRefresh){
            // 自动更新时将在当前任务队列完成后执行回调函数
            setTimeout(() => {
                callbacksArray.forEach((callback) => {
                    Lsnrctl.callback = callback;
                    callback();
                    Lsnrctl.callback = null;
                });
            });
        } else {
            // 手动更新将把回调函数队列保存，等待手动调用更新函数
            callbacksArray.forEach((callback) => Lsnrctl.refreshCalls.add(callback));
        }

        // 解开锁
        Lsnrctl.isCalling = false;
    },

    /**
     * @description: 代理传入的数据，普通数据将转为{v:value} 形式，函数将不转换
     * @author: 李永强
     * @param {any} data: 需要转化的原数据
     * @return {object}: 代理后的数据或处理后的函数
     * @datetime: 2022-12-06 09:47:18
     */
    getProxyData(data){
        if (typeof data === 'function'){
            return data;
        }
        if (typeof data === 'object' && data !== null) {
            return new Proxy(data, Lsnrctl.getProxyHandler());
        }
        return new Proxy({ value: data }, Lsnrctl.getProxyHandler());
    },

    /**
     * @description: 清空更新回调函数列表
     * @author: 李永强
     * @datetime: 2022-12-06 11:55:31
     */
    clearRefresh(){
        Lsnrctl.refreshCalls.clear();
    },

    /**
     * @description: 手动执行数据回调函数
     * @author: 李永强
     * @datetime: 2022-12-06 11:56:48
     */
    refresh(){
        if (Lsnrctl.autoRefresh) return;

        // 创建锁，防止无限回调；在执行回调时改变值将不再引起回调
        Lsnrctl.isCalling = true;

        Lsnrctl.refreshCalls.forEach((callback) => {
            Lsnrctl.callback = callback;
            callback();
            Lsnrctl.callback = null;
        });
        Lsnrctl.clearRefresh();

        // 解开锁
        Lsnrctl.isCalling = false;
    },
};
export default Lsnrctl;
