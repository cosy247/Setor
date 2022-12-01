/**
* @description: setor文件解析器入口
* @author: 李永强
* @param {string} source: 源代码
* @datetime: 2022-12-01 19:11:57
*/
module.exports = (source) => {
    const rootFragment = new DocumentFragment();
    rootFragment.innerHTML = source;
    
    const scriptStart = source.match(/<script.*?>/);
    if(scriptStart) {
        const scriptEnd = source.match(/<\/script>/);
    }
    return source;
};
