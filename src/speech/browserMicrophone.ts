export type BrowserMicrophoneResult = 'granted' | 'denied' | 'missing' | 'unavailable';

export async function requestBrowserMicrophone(): Promise<BrowserMicrophoneResult> {
  const devices = globalThis.navigator?.mediaDevices;
  if (!devices?.getUserMedia) {
    return 'unavailable';
  }
  try {
    const stream = await devices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) {
      track.stop();
    }
    return 'granted';
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
      return 'denied';
    }
    if (name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError') {
      return 'missing';
    }
    return 'unavailable';
  }
}
