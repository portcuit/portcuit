"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectorModule = void 0;
const createOrUpdate = (oldVNode, vnode) => {
    if (!vnode.data)
        return;
    if (!vnode.data.sel)
        return;
    const tokens = vnode.data.sel.split('.');
    let id;
    if (id = tokens.find((token) => token.startsWith('#'))) {
        vnode.elm.id = id.substr(1);
    }
    vnode.elm.className = tokens.filter((token) => !token.startsWith('#')).join(' ');
};
exports.selectorModule = {
    create: createOrUpdate,
    update: createOrUpdate
};
//# sourceMappingURL=selector.js.map