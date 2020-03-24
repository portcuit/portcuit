import {merge} from 'rxjs'
import {UpdateInfo, ProgressInfo} from "builder-util-runtime";
import {UpdateCheckResult, CancellationToken} from 'electron-updater'
import {source, sink, Socket} from 'pkit/core'
import {
  AutoUpdater,
  autoUpdaterSink,
  checkForUpdatesSink,
  cancelDownloadSink,
  downloadUpdateSink,
  quitAndInstallSink, PDQuitAndInstall,
  errorEventSink,
  updateAvailableEventSink,
  updateNotAvailableEventSink,
  downloadProgressEventSink,
  updateDownloadedEventSink
} from "./processors";

export class UpdaterPort {
  initAutoUpdater = new Socket<Partial<AutoUpdater>>();
  autoUpdater = new Socket<AutoUpdater>();
  checkForUpdates = new Socket<any>();
  updateCheckResult = new Socket<UpdateCheckResult>();
  downloadUpdate = new Socket<any>();
  downloadedFile = new Socket<any>();
  cancellationToken = new Socket<CancellationToken>();
  cancelDownload = new Socket<any>();
  quitAndInstall = new Socket<PDQuitAndInstall>();
  error = new Socket<Error>();
  updateAvailable = new Socket<UpdateInfo>();
  updateNotAvailable = new Socket<UpdateInfo>();
  downloadProgress = new Socket<Partial<ProgressInfo>>();
  updateDownloaded = new Socket<UpdateInfo>();
  nothing = new Socket<any>();
}

export const useUpdater = (port: UpdaterPort) =>
  merge(
    updateDownloadedEventSink(source(port.autoUpdater), sink(port.updateDownloaded)),
    downloadProgressEventSink(source(port.autoUpdater), sink(port.downloadProgress)),
    updateNotAvailableEventSink(source(port.autoUpdater), sink(port.updateNotAvailable)),
    updateAvailableEventSink(source(port.autoUpdater), sink(port.updateAvailable)),
    errorEventSink(source(port.autoUpdater), sink(port.error)),
    quitAndInstallSink(source(port.quitAndInstall), sink(port.nothing), [source(port.autoUpdater)]),

    cancelDownloadSink(source(port.cancelDownload), sink(port.nothing), [source(port.cancellationToken)]),

    downloadUpdateSink(source(port.downloadUpdate),
      sink(port.downloadedFile), sink(port.error), sink(port.cancellationToken),
      source(port.autoUpdater)),

    checkForUpdatesSink(source(port.checkForUpdates),
      sink(port.updateCheckResult), sink(port.error), [
      source(port.autoUpdater)]),
    autoUpdaterSink(source(port.initAutoUpdater), sink(port.autoUpdater)));
