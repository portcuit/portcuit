import type {LROperation} from 'google-gax'
import {google} from "@google-cloud/speech/build/protos/protos";
import {SpeechClient} from '@google-cloud/speech/build/src/v1p1beta1'
import { cycleFlow, LifecyclePort, ofProc, sink, Socket, source } from "@pkit/core";


export class GoogleCloudSpeechToTextPort extends LifecyclePort {
  client = new Socket<SpeechClient>();
  recognize = new Socket<google.cloud.speech.v1p1beta1.ILongRunningRecognizeRequest>();
  checkRecognize = new Socket<string>();
  operation = new Socket<LROperation<google.cloud.speech.v1p1beta1.ILongRunningRecognizeResponse, google.cloud.speech.v1p1beta1.ILongRunningRecognizeMetadata>>();
  response = new Socket<[google.cloud.speech.v1p1beta1.ILongRunningRecognizeResponse, google.cloud.speech.v1p1beta1.ILongRunningRecognizeMetadata, google.longrunning.Operation]>();

  circuit () {
    return cycleFlow(this, 'init', 'terminated', {
      clientFlow: (port) =>
        ofProc(sink(port.client), new SpeechClient)
    })
  }
}
