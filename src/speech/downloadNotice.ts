export const FAILED_DOWNLOAD_MESSAGE = 'Failed to download';
export const FAILED_DOWNLOAD_VISIBLE_MS = 3000;

export function messageForOfflineModelStatus(status: string): string {
  switch (status) {
    case 'download_success':
      return 'Offline speech model downloaded.';
    case 'download_scheduled':
      return 'The offline model download is scheduled. It may wait for a Wi-Fi connection.';
    case 'opened_dialog':
      return 'Confirm the system dialog to download the offline speech model.';
    case 'download_canceled':
    case 'download_cancelled':
      return FAILED_DOWNLOAD_MESSAGE;
    default:
      return 'The system opened the offline model download.';
  }
}

export function failedDownloadDismissDelay(message: string | null): number | null {
  return message === FAILED_DOWNLOAD_MESSAGE ? FAILED_DOWNLOAD_VISIBLE_MS : null;
}

export function messageForOfflineModelOutcome(status: string | null): string {
  if (!status) {
    return FAILED_DOWNLOAD_MESSAGE;
  }
  return messageForOfflineModelStatus(status);
}

export function shouldShowOfflineModelDownload(platform: string, downloadSupported: boolean): boolean {
  return platform === 'android' && downloadSupported;
}
