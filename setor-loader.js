const { default: parse } = require('node-html-parser/dist/parse');

module.exports = function(source){
    const fragment = parse(source.replaceAll('`', '\\`'));
    let script;
    let style;
    let component;

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
            name: \`${component.tagName.toLowerCase()}\`,
            html: \`${component.innerHTML}\`,
            style: \`${style.innerHTML}\`,
            data(){
                ${matchScriptString}
            },
        });
    `;
};
