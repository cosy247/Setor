/**
* @description: setor文件解析器入口
* @author: 李永强
* @param {string} source: 源代码
* @datetime: 2022-12-01 19:11:57
*/
module.exports = (source) => {
    return `
    import { renderComponent } from '../../setor';

    const documentFragment = document.createRange().createContextualFragment(\`${source}\`);
    const children = [...documentFragment.children]; 
    const scriptChildren = children.filter((child) => child.nodeName === 'SCRIPT');
    const script = scriptChildren.map((script) => script.innerHTML).join(';');

    scriptChildren.forEach((scritp) => {
        documentFragment.removeChild(scritp);
    });

    renderComponent(documentFragment, script);
    
    export default documentFragment;
    `;
};
