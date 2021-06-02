import {merge} from 'rxjs'
import {takeUntil} from 'rxjs/operators'
import type {LROperation} from 'google-gax'
import {google} from "@google-cloud/speech/build/protos/protos";
import {SpeechClient} from '@google-cloud/speech/build/src/v1p1beta1'
import { cycleFlow, latestMergeMapProc, LifecyclePort, mapToProc, mergeMapProc, ofProc, sink, Socket, source } from "@pkit/core";

export class GoogleCloudSpeechToTextPort extends LifecyclePort {
  client = new Socket<SpeechClient>();
  recognize = new Socket<google.cloud.speech.v1p1beta1.ILongRunningRecognizeRequest>();
  checkRecognize = new Socket<string>();
  operation = new Socket<LROperation<google.cloud.speech.v1p1beta1.ILongRunningRecognizeResponse, google.cloud.speech.v1p1beta1.ILongRunningRecognizeMetadata>>();
  response = new Socket<[google.cloud.speech.v1p1beta1.ILongRunningRecognizeResponse, google.cloud.speech.v1p1beta1.ILongRunningRecognizeMetadata, google.longrunning.Operation]>();

  circuit () {
    return cycleFlow(this, 'init', 'terminated', {
      clientFlow: (port) =>
        merge(
          ofProc(sink(port.client), new SpeechClient),
          mapToProc(source(port.client), sink(port.ready))
        ),
  
      recognizeFlow: (port) =>
        latestMergeMapProc(source(port.recognize), sink(port.operation),
          [source(port.client)], async ([request, client]) =>
            (await client.longRunningRecognize(request))[0],
          sink(port.err)),

      checkRecognizeFlow: (port) =>
        latestMergeMapProc(source(port.checkRecognize), sink(port.operation),
          [source(port.client)], async ([name, client]) =>
            await client.checkLongRunningRecognizeProgress(name),
          sink(port.err)),

      responseFlow: (port) =>
        mergeMapProc(source(port.operation), sink(port.response), 
          async (operation) =>
            await operation.promise()),

      terminateFlow: (port) =>
        mapToProc(source(port.terminate), sink(port.terminated))
    })
  }
}
