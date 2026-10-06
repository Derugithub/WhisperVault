import { missingSpeechModuleMessage } from '../domain/errors';
import { messageForOfflineModelOutcome } from './downloadNotice';
import { getSpeechRecognitionModule } from './nativeModule';

export async function downloadOfflineModel(locale: string): Promise<string> {
  const speech = getSpeechRecognitionModule();
  if (!speech) {
    return missingSpeechModuleMessage();
  }
  try {
    const result = await speech.androidTriggerOfflineModelDownload({
      locale,
    });
    return messageForOfflineModelOutcome(result.status);
  } catch {
    return messageForOfflineModelOutcome(null);
  }
}
