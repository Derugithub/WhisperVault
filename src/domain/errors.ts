export function unavailableCaptureMessage(platform: string): string {
  if (platform === 'web') {
    return 'This browser cannot take a voice note. Use WhisperVault on iPhone or Android.';
  }
  return 'Dictation is turned off. Turn it on in system settings, then try again.';
}

export function captureFailureMessage(code: string, platform: string): string {
  if (code === 'not-allowed') {
    if (platform === 'web') {
      return 'Microphone access is blocked. Allow the microphone for this site in the browser, then try again.';
    }
    return 'Microphone access is off. Enable it in system settings to record.';
  }
  if (platform === 'web' && (code === 'network' || code === 'service-not-allowed')) {
    return 'This browser could not transcribe just now. Check the connection and try again.';
  }
  return recognitionErrorMessage(code);
}

export function recognitionErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
      return 'Microphone access is off. Enable it in system settings to record a note.';
    case 'no-speech':
      return 'No speech was heard. Try again and speak for a moment after recording starts.';
    case 'language-not-supported':
      return 'This language is not available for on-device recognition. Choose another language in Settings, or download the offline model.';
    case 'network':
      return 'On-device recognition did not run. WhisperVault will not send this recording to a cloud speech service.';
    case 'service-not-allowed':
      return 'The system speech recognizer is unavailable. On Android, install the offline speech model. On iOS, turn on Dictation.';
    case 'busy':
      return 'The recognizer is busy. Wait a second and try again.';
    case 'audio-capture':
      return 'The microphone could not be captured. Close other apps using the mic and try again.';
    default:
      return 'Speech recognition stopped before a transcript was ready.';
  }
}
