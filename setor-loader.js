module.exports = function(source){
    const tags = [];
    {
        const tagStrings = source.replaceAll('`', '\\`').match(/<\s?(.*?)\b[^>]*>[\s\S]*<\/\1>/g);
        tagStrings.forEach((tagString) => {
            tags.push({
                tagName: tagString.match(/<.*?>/)[0].slice(1, -1).trim()
                    .split(' ')[0],
                outerHTML: tagString,
            });
        });
    }

    let name = '';
    let html = '';
    let style = '';
    let dataFunBody = '';

    // 遍历子节点查找对应节点
    tags.forEach((tag) => {
        const { tagName, outerHTML } = tag;
        if (tagName.toUpperCase() === 'SCRIPT'){
            dataFunBody = outerHTML.replace(/^<\s?script\s?>/, '').replace(/<\s?\/\s?script\s?>$/, '')
                .trim();
        } else if (tagName.toUpperCase() === 'STYLE'){
            style += outerHTML.replace(/^<\s?style\s?>/, ' ').replace(/<\s?\/\s?style\s?>$/, ' ').replace(/\s+/g, ' ');
        } else if (tagName.indexOf('-') > 0){
            const nameSplit = tagName.split(':');
            const rootTagName = nameSplit[1] || 'div';
            [name] = nameSplit;
            html += outerHTML
                .replace(new RegExp(`^<\\s?${tagName}`), `<${rootTagName}`)
                .replace(new RegExp(`${tagName}\\s?>$`), `${rootTagName}>`);
        }
    });

    // 提取script中import语句
    const imports = dataFunBody.match(/import .*?(['"`]).*?\1;?/gm);
    imports && imports.forEach((im) => {
        dataFunBody = dataFunBody.replaceAll(im, '');
    });
    dataFunBody = dataFunBody.trim();

    return `
        import { createComponent } from 'setor';
        ${imports ? `${imports.join('\n')}` : '\n'}

        createComponent({
            name:
\`${name}\`,
            html:
\`${html}\`,
            style:
\`${style}\`,
            data(){
${dataFunBody};
            },
        });
    `;
};
