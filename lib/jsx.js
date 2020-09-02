'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function vnode(sel, data, children, text, elm) {
    const key = data === undefined ? undefined : data.key;
    return { sel, data, children, text, elm, key };
}

const array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}

function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (let i = 0; i < children.length; ++i) {
            const childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
function h(sel, b, c) {
    var data = {};
    var children;
    var text;
    var i;
    if (c !== undefined) {
        if (b !== null) {
            data = b;
        }
        if (array(c)) {
            children = c;
        }
        else if (primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    else if (b !== undefined && b !== null) {
        if (array(b)) {
            children = b;
        }
        else if (primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    if (children !== undefined) {
        for (i = 0; i < children.length; ++i) {
            if (primitive(children[i]))
                children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
        }
    }
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    return vnode(sel, data, children, text, undefined);
}

function flattenAndFilter(children, flattened) {
    for (const child of children) {
        // filter out falsey children, except 0 since zero can be a valid value e.g inside a chart
        if (child !== undefined && child !== null && child !== false && child !== '') {
            if (Array.isArray(child)) {
                flattenAndFilter(child, flattened);
            }
            else if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
                flattened.push(vnode(undefined, undefined, undefined, String(child), undefined));
            }
            else {
                flattened.push(child);
            }
        }
    }
    return flattened;
}
/**
 * jsx/tsx compatible factory function
 * see: https://www.typescriptlang.org/docs/handbook/jsx.html#factory-functions
 */
function jsx(tag, data, ...children) {
    const flatChildren = flattenAndFilter(children, []);
    if (typeof tag === 'function') {
        // tag is a function component
        return tag(data, flatChildren);
    }
    else {
        if (flatChildren.length === 1 && !flatChildren[0].sel && flatChildren[0].text) {
            // only child is a simple text node, pass as text for a simpler vtree
            return h(tag, data, flatChildren[0].text);
        }
        else {
            return h(tag, data, flatChildren);
        }
    }
}

exports.jsx = jsx;
