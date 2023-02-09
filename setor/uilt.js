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

export default {
    istype,
};
