import {createMapProc, createMergeMapSink, createLatestMapSink} from "pkit/processors/index";
import {merge, fromEvent, Observable, of, from} from "rxjs";
import {catchError, map, mergeMap, withLatestFrom} from "rxjs/operators";
import {ProgressInfo, UpdateInfo} from "builder-util-runtime";
import {autoUpdater as autoUpdaterSingleton, UpdateCheckResult, CancellationToken} from "electron-updater";
import {Sink} from "pkit/core/index";

export type AutoUpdater = typeof autoUpdaterSingleton
export const autoUpdaterSink = createMapProc<Partial<AutoUpdater>, AutoUpdater>(
  (options) =>
    Object.assign(autoUpdaterSingleton, options));

export const checkForUpdatesSink = (source$: Observable<unknown>, sink: Sink<UpdateCheckResult>, error: Sink<Error>, sources$: [Observable<AutoUpdater>]) =>
  source$.pipe(
    withLatestFrom(sources$[0]),
    mergeMap(([, autoUpdater]) =>
      autoUpdater.checkForUpdates()),
    map((result) =>
      sink(result)),
    catchError(e =>
      of(error(e))));

export const downloadUpdateSink = (source$: Observable<unknown>,
                                   sink: Sink<any>, error: Sink<Error>, token: Sink<CancellationToken>,
                                   autoUpdater$: Observable<AutoUpdater>) =>
  source$.pipe(
    withLatestFrom(autoUpdater$),
    mergeMap(([, autoUpdater]) => {
      const cancellationToken = new CancellationToken;
      return merge(
        of(token(cancellationToken)),
        from(autoUpdater.downloadUpdate(cancellationToken)).pipe(
          map((downloadedFile) =>
            sink(downloadedFile)),
          catchError((e) =>
            of(error(e)))))
    }));

export const cancelDownloadSink = createLatestMapSink<unknown, void, CancellationToken>(
  ([, cancellationToken]) =>
    cancellationToken.cancel());

type IsSilent = boolean
type IsForceRunAfter = boolean;
export type PDQuitAndInstall = [IsSilent?, IsForceRunAfter?]
export const quitAndInstallSink = createLatestMapSink<PDQuitAndInstall, void, AutoUpdater>(
  ([[isSilent=false, isForceRunAfter=false]=[], autoUpdater]) =>
    autoUpdater.quitAndInstall(isSilent, isForceRunAfter));

export const errorEventSink = createMergeMapSink<AutoUpdater, Error>(
  (autoUpdater) =>
    fromEvent(autoUpdater, 'error'));

export const updateAvailableEventSink = createMergeMapSink<AutoUpdater, UpdateInfo>(
  (autoUpdater) =>
    fromEvent(autoUpdater, 'update-available'));

export const updateNotAvailableEventSink = createMergeMapSink<AutoUpdater, UpdateInfo>(
  (autoUpdater) =>
    fromEvent(autoUpdater, 'update-not-available'));

export const downloadProgressEventSink = createMergeMapSink<AutoUpdater, Partial<ProgressInfo>>(
  (autoUpdater) =>
    fromEvent(autoUpdater, 'download-progress'));

export const updateDownloadedEventSink = createMergeMapSink<AutoUpdater, UpdateInfo>(
  (autoUpdater) =>
    fromEvent(autoUpdater, 'update-downloaded'));
