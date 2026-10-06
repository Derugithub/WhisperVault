import { missingSpeechModuleMessage } from '../domain/errors';
import { getSpeechRecognitionModule } from './nativeModule';

export async function downloadOfflineModel(locale: string): Promise<string> {
  const speech = getSpeechRecognitionModule();
  if (!speech) {
    return missingSpeechModuleMessage();
  }
  const result = await speech.androidTriggerOfflineModelDownload({
    locale,
  });
  switch (result.status) {
    case 'download_success':
      return 'Offline speech model downloaded.';
    case 'download_scheduled':
      return 'The offline model download is scheduled. It may wait for a Wi-Fi connection.';
    case 'opened_dialog':
      return 'Confirm the system dialog to download the offline speech model.';
    default:
      return 'The system opened the offline model download.';
  }
}
