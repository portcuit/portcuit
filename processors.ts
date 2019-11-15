import {app,BrowserWindow} from 'electron'
import {fromEvent} from 'rxjs'
import {latestMapSink,latestMergeMapSink,mapSink,mergeMapSink} from '@pkit/helper'

const _load = (window, url, options={}) =>
  window.loadURL(url, options);

const _terminate = window =>
  window.destroy();

const _open = options =>
  new BrowserWindow(options);

const _close = () =>
  fromEvent(app, 'window-all-closed');

export const load = latestMergeMapSink(_load, [1, 0], [0, 0], [0, 1]);
export const terminate = latestMapSink(_terminate, [1, 0]);
export const open = mapSink(_open, [0]);
export const close = mergeMapSink(_close);
export const quit = mapSink(app.quit);
export const ready = mergeMapSink(app.whenReady);
