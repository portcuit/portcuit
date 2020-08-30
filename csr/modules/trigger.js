"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerModule = void 0;
const createOrUpdate = (oldVNode, vnode) => {
    if (!vnode.data)
        return;
    if (!vnode.data.trigger)
        return;
    const trigger = vnode.data.trigger;
    const elm = vnode.elm;
    if (trigger.focus !== undefined) {
        elm.focus({ preventScroll: trigger.focus });
    }
};
exports.triggerModule = {
    create: createOrUpdate,
    update: createOrUpdate
};
//# sourceMappingURL=trigger.js.map