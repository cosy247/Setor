module.exports = function(source){
    return `
        import { createComponent } from 'setor';

        const fragment = window.document.createRange().createContextualFragment(\`${source.replaceAll('`', '\\`')}\`);
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
