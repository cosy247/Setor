const istype = (data, ...types) => {
    const dataType = Object.prototype.toString.call(data).slice(8, -1)
        .toUpperCase();
    return types.some((type) => type.toUpperCase() === dataType);
};

const output = {
    error(msg){
        console.error(
            `%c Error %c ${msg} %c`,
            'background:#e83471; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
            'border: solid 1px #e83471; border-radius: 0 3px 3px 0;',
            'background:transparent',
        );
    },
    log(msg){
        console.log(
            `%c Log %c ${msg} %c`,
            'background:#279ae5; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
            'border: solid 1px #279ae5; border-radius: 0 3px 3px 0;',
            'background:transparent',
        );
    },
    warn(msg){
        console.warn(
            `%c Warn %c ${msg} %c`,
            'background:#efa833; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
            'border: solid 1px #efa833; border-radius: 0 3px 3px 0;',
            'background:transparent',
        );
    },
    throw(){},
};

export {
    istype,
    output,
};
