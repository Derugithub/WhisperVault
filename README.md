# WhisperVault

A local-first voice journal for iOS and Android. You record a note, the operating system transcribes it on the device, and the transcript is saved in SQLite on the phone.

There is no account, no sync, and no cloud speech-to-text.

## What is stored

Each note is a row in `whispervault.db`:

| Field | Meaning |
| --- | --- |
| `id` | Local identifier |
| `createdAt` | When the recording started |
| `transcript` | Text from the on-device recognizer |
| `audioUri` | Optional local recording file, when the device can save one |

Search is a plain case-insensitive text match against those transcripts.

## Run it

Speech recognition uses a native module, so Expo Go cannot run this app. Build a development client:

```bash
npm install
npx expo run:ios
npx expo run:android
```

On Android 13 and later, the first recording in a language may ask the system to download an offline speech model. WhisperVault does not fall back to a network recognizer if that model is missing.

## Device checklist

- Record a note, watch the live transcript, stop, and confirm the note opens.
- Leave the note, reopen the app, and confirm the note is still in the list.
- Search for a word from the transcript.
- Play the saved recording when the device stored an audio file.
- Turn on airplane mode and record again. Transcription still finishes on the device.
- On Android, download the offline speech model if prompted, then record.
- Deny microphone permission and confirm the app explains how to enable it.
- Change the recognition language, delete one note, and delete all notes.
