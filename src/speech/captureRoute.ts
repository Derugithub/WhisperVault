import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Platform } from 'react-native';
import { planCapture, type CaptureRoute } from './plan';

export function readCaptureRoute(): CaptureRoute {
  let recognitionAvailable = false;
  let onDeviceSupported = false;
  try {
    recognitionAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    onDeviceSupported = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
  } catch {
    recognitionAvailable = false;
    onDeviceSupported = false;
  }
  return planCapture({
    platform: Platform.OS,
    recognitionAvailable,
    onDeviceSupported,
  });
}
