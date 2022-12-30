import lsnrctl from './lsnrctl';
import uilt from './uilt';

/** 共享数据store */
let store = {};

const setStore = (data) => {
    if (uilt.istype(data, 'Object')){
        store = lsnrctl.getProxyData(data);
    } else {
        console.error('store应该为简单object类型');
    }
};

export {
    store,
    setStore,
};
