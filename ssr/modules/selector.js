"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectorModule = void 0;
exports.selectorModule = (vnode, attributes) => {
    if (!vnode.data || !vnode.data.sel)
        return;
    const tokens = vnode.data.sel.split('.');
    let id;
    if (id = tokens.find((token) => token.startsWith('#'))) {
        attributes.set('id', id);
    }
    attributes.set('class', tokens.filter((token) => !token.startsWith('#')).join(' '));
};
//# sourceMappingURL=selector.js.map