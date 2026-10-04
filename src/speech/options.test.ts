import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRecognitionOptions, volumeToLevel } from './options.ts';

describe('buildRecognitionOptions', () => {
  it('always requests on-device recognition', () => {
    const options = buildRecognitionOptions({
      lang: 'en-US',
      noteId: 'note-1',
      outputDirectory: 'file:///documents/recordings',
      useAndroidOnDevicePackage: true,
    });

    assert.equal(options.requiresOnDeviceRecognition, true);
    assert.equal(options.continuous, true);
    assert.equal(options.interimResults, true);
    assert.equal(options.androidRecognitionServicePackage, 'com.google.android.as');
    assert.equal(options.recordingOptions?.persist, true);
    assert.equal(options.recordingOptions?.outputFileName, 'note-1.wav');
    assert.equal(options.recordingOptions?.outputDirectory, 'file:///documents/recordings/');
  });

  it('omits the audio file when the device cannot persist a recording', () => {
    const options = buildRecognitionOptions({
      lang: 'en-GB',
      noteId: 'note-2',
      outputDirectory: null,
      useAndroidOnDevicePackage: false,
    });
    assert.equal(options.recordingOptions, undefined);
    assert.equal(options.androidRecognitionServicePackage, undefined);
    assert.equal(options.requiresOnDeviceRecognition, true);
  });
});

describe('volumeToLevel', () => {
  it('maps the recognizer meter onto 0 to 1', () => {
    assert.equal(volumeToLevel(-2), 0);
    assert.equal(volumeToLevel(10), 1);
    assert.equal(volumeToLevel(4), 0.5);
    assert.equal(volumeToLevel(40), 1);
  });
});
