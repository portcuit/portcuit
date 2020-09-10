'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function updateProps(oldVnode, vnode) {
    var key;
    var cur;
    var old;
    var elm = vnode.elm;
    var oldProps = oldVnode.data.props;
    var props = vnode.data.props;
    if (!oldProps && !props)
        return;
    if (oldProps === props)
        return;
    oldProps = oldProps || {};
    props = props || {};
    for (key in props) {
        cur = props[key];
        old = oldProps[key];
        if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
            elm[key] = cur;
        }
    }
}
const propsModule = { create: updateProps, update: updateProps };

exports.propsModule = propsModule;
