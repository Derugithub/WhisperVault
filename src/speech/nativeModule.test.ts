import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, describe, it } from 'node:test';
import { getSpeechRecognitionModule, setSpeechModuleLoaderForTests } from './nativeModule.ts';

const require = createRequire(import.meta.url);

afterEach(() => {
  setSpeechModuleLoaderForTests(null);
});

describe('speech module loader', () => {
  it('returns null when loading throws the Expo Go native-module error', () => {
    setSpeechModuleLoaderForTests(() => {
      throw new Error("Cannot find native module 'ExpoSpeechRecognition'");
    });
    assert.equal(getSpeechRecognitionModule(), null);
  });

  it('returns the recognizer when the installed app provides it', () => {
    const installed = {
      start() {},
      stop() {},
      abort() {},
      addListener() {
        return { remove() {} };
      },
    };
    setSpeechModuleLoaderForTests(() => installed);
    assert.equal(getSpeechRecognitionModule(), installed);
  });

  it('catches a missing ExpoSpeechRecognition module from the package itself', () => {
    setSpeechModuleLoaderForTests(() => require('expo-speech-recognition').ExpoSpeechRecognitionModule);
    assert.equal(getSpeechRecognitionModule(), null);
  });
});
