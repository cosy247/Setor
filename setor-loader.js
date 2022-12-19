module.exports = function(source){
    const imports = source.match(/import .*?(['"`]).*?\1$/gm);
    let matchSource = source.replaceAll('`', '\\`');
    imports && imports.forEach((im) => {
        matchSource = matchSource.replaceAll(im, '');
    });

    return `
        import { createComponent } from 'setor';
        ${imports ? imports.join(';') : ''}

        const fragment = window.document.createRange().createContextualFragment(\`${matchSource}\`);
        let name = '';
        let html = '';
        let style = '';
        let script = 'return {}';

        fragment.childNodes.forEach((child) => {
            const { nodeName } = child;
            if (nodeName === 'SCRIPT'){
                script = child.innerHTML;
            } else if (nodeName === 'STYLE'){
                style = child.innerHTML;
            } else if (nodeName.indexOf('-') > 0){
                name = nodeName.toLowerCase();
                html = child.innerHTML;
            }
        });

        createComponent({
            name,
            html,
            style,
            data:new Function(script),
        });
    `;
};
