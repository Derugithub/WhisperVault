import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { localeInstalled, resolveRecognitionLanguage } from './languages.ts';

describe('resolveRecognitionLanguage', () => {
  it('prefers a stored language', () => {
    assert.equal(resolveRecognitionLanguage('en-US', 'fr-FR'), 'fr-FR');
  });

  it('matches the device language when nothing is stored', () => {
    assert.equal(resolveRecognitionLanguage('ja_JP', null), 'ja-JP');
    assert.equal(resolveRecognitionLanguage('es-MX', null), 'es-ES');
  });

  it('falls back to English (US)', () => {
    assert.equal(resolveRecognitionLanguage('sv-SE', 'not-a-language'), 'en-US');
  });
});

describe('localeInstalled', () => {
  it('treats an empty install list as missing', () => {
    assert.equal(localeInstalled([], 'en-US'), false);
  });

  it('matches language tags with different separators', () => {
    assert.equal(localeInstalled(['en_US'], 'en-US'), true);
    assert.equal(localeInstalled(['fr-FR'], 'de-DE'), false);
  });
});
