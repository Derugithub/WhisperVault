import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  captureFailureMessage,
  describeCaptureAvailability,
  missingSpeechModuleMessage,
  recognitionErrorMessage,
  unavailableCaptureMessage,
} from './errors.ts';

describe('recognitionErrorMessage', () => {
  it('refuses a cloud fallback when recognition reports a network error', () => {
    const message = recognitionErrorMessage('network');
    assert.match(message, /will not send/i);
    assert.doesNotMatch(message, /try again online/i);
  });
});

describe('capture prompts', () => {
  it('tells a browser without speech recognition to use the phone app', () => {
    const message = unavailableCaptureMessage('web');
    assert.match(message, /iPhone or Android/);
    assert.doesNotMatch(message, /native|module|development build|Expo/i);
  });

  it('points a denied browser microphone at the site permission', () => {
    const message = captureFailureMessage('not-allowed', 'web');
    assert.match(message, /browser/i);
    assert.doesNotMatch(message, /system settings/i);
  });

  it('points a denied phone microphone at system settings', () => {
    assert.match(captureFailureMessage('not-allowed', 'ios'), /system settings/i);
  });

  it('tells a phone without the speech recognizer to use the installed app', () => {
    const message = missingSpeechModuleMessage();
    assert.match(message, /installed WhisperVault build/i);
    assert.doesNotMatch(message, /native|module|Expo Go|Metro|development/i);
  });

  it('hides the record action when the phone has no speech recognizer', () => {
    const availability = describeCaptureAvailability('needs-install', 'android');
    assert.equal(availability.canStart, false);
    assert.equal(availability.canOpenSettings, false);
    assert.match(availability.message ?? '', /installed WhisperVault build/i);
  });

  it('keeps recording available when the installed app can recognize speech', () => {
    const availability = describeCaptureAvailability('on-device', 'ios');
    assert.equal(availability.canStart, true);
    assert.equal(availability.message, null);
  });
});
