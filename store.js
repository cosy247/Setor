// store
let store = null;
const setStore = (data) => {
    if (store === null && Object.prototype.toString(data) === '[object Object]'){
        store = data;
    }
};

export {
    store,
    setStore,
};
