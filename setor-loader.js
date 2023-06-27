module.exports = function (source) {
    const tags = [];
    {
        const tagStrings = source.replaceAll('`', '\\`').match(/<\s?(.*?)\b[^>]*>[\s\S]*<\/\1>/g);
        tagStrings.forEach((tagString) => {
            tags.push({
                tagName: tagString.match(/<.*?>/)[0].slice(1, -1).trim().split(' ')[0],
                outerHTML: tagString,
            });
        });
    }

    let name = '';
    let html = '';
    let dataFunBody = '';

    // 遍历子节点查找对应节点
    tags.forEach((tag) => {
        const { tagName, outerHTML } = tag;
        if (tagName.toUpperCase() === 'SCRIPT') {
            dataFunBody = outerHTML
                .replace(/^<\s?script\s?>/, '')
                .replace(/<\s?\/\s?script\s?>$/, '')
                .trim();
        } else if (tagName.toUpperCase() === 'STYLE') {
            html += outerHTML;
        } else if (tagName.includes('-')) {
            const nameSplit = tagName.split(':');
            if (name !== '' || nameSplit[0] === '') return;
            name = nameSplit[0];
            // html += outerHTML;
            if(nameSplit.length > 1) {
                const rootTagName = nameSplit[1];
                html += outerHTML.replace(new RegExp(`^<\\s?${tagName}`), `<${rootTagName}`).replace(new RegExp(`${tagName}\\s?>$`), `${rootTagName}>`);
            } else {
                html += outerHTML.replace(new RegExp(`^<\\s*${tagName}(\\s.*?|)>`), '').replace(new RegExp(`<\\s?/\\s?${tagName}\\s?>$`), '');
            }
        }
    });

    // 提取script中import语句
    const imports = dataFunBody.match(/import .*?(['"`]).*?\1;?/gm) || [];
    imports.forEach((im) => {
        dataFunBody = dataFunBody.replaceAll(im, '');
    });
    dataFunBody = dataFunBody.trim();

    return `
        import { createComponent } from 'setor';
        ${imports ? `${imports.join('\n')}` : '\n'}
    
        createComponent({
            name: \`${name}\`,
            html: \`${html}\`,
            getValueFunFunctory(){
                ${dataFunBody};
                return (codeString) => eval(\`() => (\${codeString})\`);
            },
        });
    `;
};
