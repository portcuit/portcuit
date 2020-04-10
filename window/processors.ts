import {BrowserWindow, BrowserWindowConstructorOptions, LoadURLOptions} from "electron";
import {fromEvent} from 'rxjs'
import {createMapProc, createLatestMapProc, createMergeMapProc} from 'pkit/processors'

export const openSink = createMapProc<BrowserWindowConstructorOptions, BrowserWindow>(
  (options) =>
    new BrowserWindow(options));

export const closeSink = createLatestMapProc<unknown, void, [BrowserWindow]>(
  ([, window]) =>
    window.close());

type URL = string
export type PDLoad = [URL, LoadURLOptions?]
export const loadSink = createLatestMapProc<PDLoad, void, [BrowserWindow]>(
  ([[url, options], window]) =>
    window.loadURL(url, options));

export const readyToShowEventSink = createMergeMapProc<BrowserWindow, void>(
  (window) =>
    fromEvent(window, 'ready-to-show'));

export const showSink = createLatestMapProc<unknown, void, [BrowserWindow]>(
  ([, window]) =>
    window.show());
