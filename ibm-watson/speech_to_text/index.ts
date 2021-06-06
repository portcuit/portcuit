import SpeechToTextV1, {RecognizeWebSocketParams} from 'ibm-watson/speech-to-text/v1'
import {SpeechRecognitionResults} from "ibm-watson/speech-to-text/v1-generated";
import RecognizeStream from 'ibm-watson/lib/recognize-stream'
import {IamAuthenticator} from 'ibm-watson/auth'
import {cycleFlow, directProc, Port, mapProc, sink, Socket, source} from "@pkit/core";
import {fromEvent, merge, of} from "rxjs";
import {switchMap, take} from "rxjs/operators";

export class IbmWatsonSpeechToTextPort extends Port {
  init = new Socket<{
    apikey: string,
    serviceUrl: string,
    recognizeWebSocketParams: RecognizeWebSocketParams
  }>();

  speechToText = new Socket<SpeechToTextV1>();
  recognizeStream = new Socket<RecognizeStream>();
  speechRecognitionResults = new Socket<SpeechRecognitionResults>();

  flow() {
    return cycleFlow(this, 'init', 'complete', {
      speechToTextFlow: (port, params) =>
        mapProc(of(params), sink(port.speechToText),
          ({apikey, serviceUrl}) =>
            new SpeechToTextV1({
              authenticator: new IamAuthenticator({apikey}),
              serviceUrl,
              disableSslVerification: true,
            })),

      recognizeStreamFlow: (port, {recognizeWebSocketParams}) =>
        mapProc(source(port.speechToText), sink(port.recognizeStream),
          (speechToText) =>
            speechToText.recognizeUsingWebSocket(recognizeWebSocketParams)),

      streamEventFlow: (port) =>
          source(port.recognizeStream).pipe(
            switchMap((recognizeStream) => merge(
              directProc(fromEvent<SpeechRecognitionResults>(recognizeStream, 'data'), sink(port.speechRecognitionResults)),
              directProc(fromEvent<Error>(recognizeStream, 'error'), sink(port.err)),

              // TODO: ここでエラーになる時ある  [ 1006, 'Socket Error: write EPIPE' ]
              directProc(fromEvent(recognizeStream, 'close').pipe(take(1)), sink(port.complete))
            )))
    })
  }
}
