import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FAILED_DOWNLOAD_MESSAGE,
  FAILED_DOWNLOAD_VISIBLE_MS,
  failedDownloadDismissDelay,
  messageForOfflineModelOutcome,
  messageForOfflineModelStatus,
} from './downloadNotice.ts';

describe('offline model download copy', () => {
  it('keeps the success and in-progress notices', () => {
    assert.equal(messageForOfflineModelStatus('download_success'), 'Offline speech model downloaded.');
    assert.match(messageForOfflineModelStatus('download_scheduled'), /Wi-Fi/);
    assert.match(messageForOfflineModelStatus('opened_dialog'), /system dialog/);
    assert.match(messageForOfflineModelStatus('something_else'), /opened the offline model download/);
    assert.equal(messageForOfflineModelOutcome('download_success'), 'Offline speech model downloaded.');
  });

  it('uses the short failure line when the download is canceled', () => {
    assert.equal(messageForOfflineModelStatus('download_canceled'), FAILED_DOWNLOAD_MESSAGE);
    assert.equal(messageForOfflineModelOutcome('download_cancelled'), FAILED_DOWNLOAD_MESSAGE);
    assert.equal(FAILED_DOWNLOAD_MESSAGE, 'Failed to download');
    assert.equal(failedDownloadDismissDelay(FAILED_DOWNLOAD_MESSAGE), FAILED_DOWNLOAD_VISIBLE_MS);
    assert.equal(FAILED_DOWNLOAD_VISIBLE_MS, 3000);
    assert.equal(failedDownloadDismissDelay('Offline speech model downloaded.'), null);
    assert.equal(failedDownloadDismissDelay(null), null);
  });

  it('drops a failed download to the short line instead of a native error code', () => {
    const message = messageForOfflineModelOutcome(null);
    assert.equal(message, 'Failed to download');
    assert.doesNotMatch(message, /error|\d/);
  });
});
