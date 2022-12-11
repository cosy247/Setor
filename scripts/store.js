// store
let store = null;
const setSore = (data) => {
    if (store === null && Object.prototype.toString(data) === '[object Object]'){
        store = data;
    }
};

export {
    store,
    setSore,
};
