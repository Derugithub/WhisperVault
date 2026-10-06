import { Platform } from 'react-native';
import { getSpeechRecognitionModule } from './nativeModule';
import { planCapture, type CaptureRoute } from './plan';

export function readCaptureRoute(): CaptureRoute {
  const speech = getSpeechRecognitionModule();
  if (!speech) {
    return planCapture({
      platform: Platform.OS,
      recognitionAvailable: false,
      onDeviceSupported: false,
      moduleInstalled: false,
    });
  }

  let recognitionAvailable = false;
  let onDeviceSupported = false;
  try {
    recognitionAvailable = speech.isRecognitionAvailable();
    onDeviceSupported = speech.supportsOnDeviceRecognition();
  } catch {
    recognitionAvailable = false;
    onDeviceSupported = false;
  }
  return planCapture({
    platform: Platform.OS,
    recognitionAvailable,
    onDeviceSupported,
    moduleInstalled: true,
  });
}
