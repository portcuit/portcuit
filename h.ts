import h from 'snabbdom/h'
import {is} from 'ramda'

export default (tagName, props, ...children) =>
  h(tagName, props ? props : {}, is(Array)(children[0]) ? children[0] : children);
