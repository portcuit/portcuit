import {classNamesModule} from './classNames.js'
import {selectorModule} from './selector.js';
import {triggerModule} from './trigger.js'
import {dispatcherModule} from './dispatcher.js'
import {jsxModule} from './jsx.js'
import {propsModule, attributesModule, styleModule, eventListenersModule, datasetModule} from 'snabbdom'

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