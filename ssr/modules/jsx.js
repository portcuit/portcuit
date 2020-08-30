"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsxModule = void 0;
exports.jsxModule = (vnode, attributes) => {
    if (!vnode.data)
        return;
    for (const [key, value] of Object.entries(vnode.data)) {
        if (['sel', 'class'].includes(key))
            continue;
        attributes.set(key, value);
    }
};
//# sourceMappingURL=jsx.js.map