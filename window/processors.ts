import {BrowserWindow, BrowserWindowConstructorOptions, LoadURLOptions} from "electron";
import {fromEvent} from 'rxjs'
import {createMapSink, createLatestMapSink, createMergeMapSink} from 'pkit/processors'

export const openSink = createMapSink<BrowserWindowConstructorOptions, BrowserWindow>(
  (options) =>
    new BrowserWindow(options));

export const closeSink = createLatestMapSink<unknown, void, BrowserWindow>(
  ([, window]) =>
    window.close());

type URL = string
export type PDLoad = [URL, LoadURLOptions?]
export const loadSink = createLatestMapSink<PDLoad, void, BrowserWindow>(
  ([[url, options], window]) =>
    window.loadURL(url, options));

export const readyToShowEventSink = createMergeMapSink<BrowserWindow, void>(
  (window) =>
    fromEvent(window, 'ready-to-show'));

export const showSink = createLatestMapSink<unknown, void, BrowserWindow>(
  ([, window]) =>
    window.show());
