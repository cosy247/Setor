const { default: parse } = require('node-html-parser/dist/parse');

module.exports = function(source){
    const fragment = parse(source.replaceAll('`', '\\`'));
    let script;
    let style;
    let component;

    // 遍历子节点查找对应节点
    fragment.childNodes.forEach((child) => {
        const { tagName } = child;
        if (!tagName) return;

        if (tagName === 'SCRIPT'){
            script = child;
        } else if (tagName === 'STYLE'){
            style = child;
        } else if (tagName.indexOf('-') > 0){
            component = child;
        }
    });

    // 获取根节点名
    const [componnetName, rootTagName] = component.tagName.split(':');
    component.tagName = rootTagName || 'div';

    // 提取script中import语句
    const scriptString = script.innerHTML;
    const imports = scriptString.match(/import .*?(['"`]).*?\1/gm);
    let matchScriptString = scriptString;
    imports && imports.forEach((im) => {
        matchScriptString = matchScriptString.replaceAll(im, '');
    });

    return `
        import { createComponent } from 'setor';
        ${imports ? imports.join(';') : ''};

        createComponent({
            name: \`${componnetName.toLowerCase()}\`,
            html: \`${component.outerHTML}\`,
            style: \`${style.innerHTML}\`,
            data(){
                ${matchScriptString}
            },
        });
    `;
};
