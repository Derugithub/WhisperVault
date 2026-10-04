import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planCapture } from './plan.ts';

describe('planCapture', () => {
  it('uses the browser recognizer on the web when speech recognition exists', () => {
    assert.equal(
      planCapture({ platform: 'web', recognitionAvailable: true, onDeviceSupported: false }),
      'browser',
    );
  });

  it('does not offer a record action when the browser has no recognizer', () => {
    assert.equal(
      planCapture({ platform: 'web', recognitionAvailable: false, onDeviceSupported: false }),
      'unavailable',
    );
  });

  it('keeps iOS and Android on the on-device recognizer', () => {
    assert.equal(
      planCapture({ platform: 'ios', recognitionAvailable: true, onDeviceSupported: true }),
      'on-device',
    );
    assert.equal(
      planCapture({ platform: 'android', recognitionAvailable: true, onDeviceSupported: true }),
      'on-device',
    );
  });

  it('asks Android to download a model instead of starting a network recognizer', () => {
    assert.equal(
      planCapture({ platform: 'android', recognitionAvailable: true, onDeviceSupported: false }),
      'needs-model',
    );
  });
});
