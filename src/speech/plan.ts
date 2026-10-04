export type CaptureRoute = 'browser' | 'on-device' | 'needs-model' | 'unavailable';

export function planCapture(input: {
  platform: string;
  recognitionAvailable: boolean;
  onDeviceSupported: boolean;
}): CaptureRoute {
  if (input.platform === 'web') {
    return input.recognitionAvailable ? 'browser' : 'unavailable';
  }
  if (input.platform !== 'ios' && input.platform !== 'android') {
    return 'unavailable';
  }
  if (!input.recognitionAvailable) {
    return 'unavailable';
  }
  if (!input.onDeviceSupported) {
    return input.platform === 'android' ? 'needs-model' : 'unavailable';
  }
  return 'on-device';
}
