"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Touch = exports.Fragment = void 0;
const jsx_1 = require("@pkit/snabbdom/jsx");
exports.Fragment = (props, children) => children;
exports.Touch = ({ cond }, children) => jsx_1.jsx(exports.Fragment, null, cond ? children : undefined);
const Dummy = jsx_1.jsx("p", null, "dummy");
//# sourceMappingURL=helper.js.map