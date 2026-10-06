import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatElapsed, formatNoteFull, formatNoteWhen, noteCountLabel } from './format.ts';

describe('noteCountLabel', () => {
  it('counts notes without a device phrase', () => {
    assert.equal(noteCountLabel(0), '0 notes');
    assert.equal(noteCountLabel(1), '1 note');
    assert.equal(noteCountLabel(2), '2 notes');
    assert.doesNotMatch(noteCountLabel(0), /on this device/);
    assert.doesNotMatch(noteCountLabel(1), /on this device/);
  });
});

describe('formatElapsed', () => {
  it('formats minutes and seconds', () => {
    assert.equal(formatElapsed(0), '0:00');
    assert.equal(formatElapsed(65_000), '1:05');
  });
});

describe('formatNoteWhen', () => {
  const now = new Date(2026, 9, 4, 15, 30);

  it('labels notes from the same calendar day', () => {
    const morning = new Date(2026, 9, 4, 9, 5).getTime();
    assert.equal(formatNoteWhen(morning, now), 'Today · 9:05 AM');
  });

  it('labels the previous calendar day', () => {
    const yesterday = new Date(2026, 9, 3, 21, 15).getTime();
    assert.equal(formatNoteWhen(yesterday, now), 'Yesterday · 9:15 PM');
  });

  it('uses a short date for older notes', () => {
    const older = new Date(2026, 8, 12, 8, 0).getTime();
    assert.equal(formatNoteWhen(older, now), 'Sep 12 · 8:00 AM');
  });
});

describe('formatNoteFull', () => {
  it('includes the weekday and year', () => {
    const timestamp = new Date(2026, 9, 4, 9, 5).getTime();
    assert.equal(formatNoteFull(timestamp), 'Sunday, Oct 4, 2026 · 9:05 AM');
  });
});
