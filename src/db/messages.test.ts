import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { localDatabaseMessage } from './messages.ts';

describe('localDatabaseMessage', () => {
  it('hides storage engine failures', () => {
    const message = localDatabaseMessage(new Error('Invalid VFS state'));
    assert.match(message, /could not be opened/i);
    assert.doesNotMatch(message, /vfs/i);
  });
});
