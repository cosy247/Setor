module.exports = (source) => {
    source.replace(/<script.*?>([\s\S]+?)<\/script>/gim, function (_, js) {
        console.log(js);
    });
    return source;
};
