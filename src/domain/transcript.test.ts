import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTranscriptState, previewTranscript, reduceTranscript } from './transcript.ts';

describe('reduceTranscript', () => {
  it('keeps interim text out of the committed tally', () => {
    const interim = reduceTranscript(createTranscriptState(), {
      transcript: 'hello',
      isFinal: false,
    });
    assert.equal(interim.display, 'hello');
    assert.equal(interim.tally, '');

    const finalResult = reduceTranscript(interim, { transcript: 'hello', isFinal: true });
    assert.equal(finalResult.tally, 'hello');
    assert.equal(finalResult.display, 'hello');
  });

  it('appends later final utterances with a single space', () => {
    const first = reduceTranscript(createTranscriptState(), {
      transcript: 'Morning pages',
      isFinal: true,
    });
    const second = reduceTranscript(first, { transcript: 'about the garden.', isFinal: true });
    assert.equal(second.display, 'Morning pages about the garden.');
  });

  it('does not double a space the recognizer already returned', () => {
    const first = reduceTranscript(createTranscriptState(), {
      transcript: 'Hello ',
      isFinal: true,
    });
    const second = reduceTranscript(first, { transcript: 'there', isFinal: false });
    assert.equal(second.display, 'Hello there');
    assert.equal(second.tally, 'Hello ');
  });
});

describe('previewTranscript', () => {
  it('collapses whitespace for list previews', () => {
    assert.equal(previewTranscript('  line one\n\nline two  '), 'line one line two');
  });
});
