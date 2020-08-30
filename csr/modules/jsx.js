"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsxModule = void 0;
const createOrUpdate = (oldVNode, vnode) => {
    if (!vnode.data)
        return;
    Object.entries(vnode.data)
        .forEach(([key, value]) => {
        if (['type', 'value', 'placeholder', 'autofocus', 'checked'].includes(key)) {
            vnode.elm[key] = value;
        }
        if (['for', 'href'].includes(key)) {
            vnode.elm.setAttribute(key, value);
        }
    });
};
exports.jsxModule = {
    create: createOrUpdate,
    update: createOrUpdate
};
//# sourceMappingURL=jsx.js.map