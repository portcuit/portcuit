import {classNamesModule} from './classNames.js'
import {selectorModule} from './selector.js';
import {triggerModule} from './trigger.js'
import {dispatcherModule} from './dispatcher.js'
import {jsxModule} from './jsx.js'
import {propsModule} from "snabbdom/modules/props";
import {attributesModule} from "snabbdom/modules/attributes";
import {styleModule} from "snabbdom/modules/style";
import {eventListenersModule} from "snabbdom/modules/eventlisteners";
import {datasetModule} from "snabbdom/modules/dataset";

export {createActionModule, ActionDetail} from "./action.js";

export const defaultModules = [
  selectorModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  datasetModule,
  triggerModule,
  dispatcherModule,
  jsxModule,
  classNamesModule
];