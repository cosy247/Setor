class Router{
    static map = {};
    static path = (() => {
        window.addEventListener('hashchange', () => {
            const newPath = location.hash.slice(2).split('/');
            this.refreshRouterView(this.path, newPath);
            this.path = newPath;
        });
        const newPath = location.hash.slice(2).split('/');
        this.refreshRouterView([''], newPath);
        return newPath;
    })();
    static refreshRouterView(oldPath, newPath){
        const { map } = Router;
        let mPath = '#';
        const hiddenRouters = new Set();
        const showRouters = new Set();

        for (const p of newPath){
            if (p === '') break;
            mPath += `/${p}`;
            if (map[mPath]){
                for (const m of map[mPath]){
                    showRouters.add(m);
                }
            }
        }

        mPath = '#';
        for (const p of oldPath){
            if (p === '') break;
            mPath += `/${p}`;
            if (map[mPath]){
                for (const m of map[mPath]){
                    showRouters.has(m) || hiddenRouters.add(m);
                }
            }
        }

        hiddenRouters.forEach((router) => this.hiddenRouterNode(router));
        showRouters.forEach((router) => this.showRouterNode(router));
    }
    static to(path){
        location.hash = `#/${path}`;
    }
    static showRouterNode(router){
        router.anchor.parentNode.insertBefore(router.node, router.anchor);
    }
    static hiddenRouterNode(router){
        router.anchor.parentNode.removeChild(router.node);
    }
}

Setor.defineSpecial('router', (node, valueString, adorns, valueFun, lsnrctl) => {
    const anchor = document.createComment('router');
    node.parentNode.insertBefore(anchor, node);
    const router = { anchor, node };

    const hash = `#/${valueString}`;

    if (!Router.map[hash]){
        Router.map[hash] = [];
    }
    Router.map[hash].push(router);

    if (location.hash.indexOf(hash) !== 0){
        Router.hiddenRouterNode(router);
    }
});

Object.assign(Setor.prototype, {
    to: Router.to,
    path: Router.path,
});
