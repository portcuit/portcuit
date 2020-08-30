"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActionModule = void 0;
exports.createActionModule = (target) => {
    const createOrUpdate = (oldVnode, vnode) => {
        var _a;
        if (!vnode.data)
            return;
        if (!vnode.data.bind)
            return;
        const [action, detail] = vnode.data.bind;
        vnode.elm.dataset.detail = JSON.stringify(detail);
        (_a = vnode.data).on || (_a.on = {});
        Object.entries(action)
            .reduce((acc, [key, value]) => Object.assign(acc, {
            [key]: (ev) => {
                const fn = new Function(`return ${value};`)()(ev);
                if (fn !== undefined) {
                    target.dispatchEvent(new CustomEvent('action', {
                        detail: [fn.toString(), cloneEvent(ev)]
                    }));
                }
            }
        }), vnode.data.on);
    };
    return {
        create: createOrUpdate,
        update: createOrUpdate
    };
};
const cloneEvent = (ev) => ({
    detail: JSON.parse(ev.currentTarget.dataset.detail || 'null'),
    clientX: ev.clientX,
    clientY: ev.clientY,
    key: ev.key,
    code: ev.code,
    currentTarget: {
        value: ev.currentTarget.value,
        checked: ev.currentTarget.checked,
        dataset: { ...ev.currentTarget.dataset }
    }
});
//# sourceMappingURL=action.js.map