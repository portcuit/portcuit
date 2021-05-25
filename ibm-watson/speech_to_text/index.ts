import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1'
import {IamAuthenticator} from 'ibm-watson/auth'
import {config} from 'dotenv'

config();

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: `${process.env.IBM_WATSON_APIKEY}`,
  }),
  serviceUrl: `${process.env.IBM_WATSON_SPEECH_TO_TEXT_URL}`,
  disableSslVerification: true,
});

const params = {
  objectMode: true,
  contentType: 'audio/flac',
  model: 'en-US_BroadbandModel',
  keywords: ['colorado', 'tornado', 'tornadoes'],
  keywordsThreshold: 0.5,
  maxAlternatives: 3,
};

const recognizeStream = speechToText.recognizeUsingWebSocket(params);