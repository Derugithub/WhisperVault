import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recognitionErrorMessage } from './errors.ts';

describe('recognitionErrorMessage', () => {
  it('refuses a cloud fallback when recognition reports a network error', () => {
    const message = recognitionErrorMessage('network');
    assert.match(message, /will not send/i);
    assert.doesNotMatch(message, /try again online/i);
  });
});
