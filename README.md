# WhisperVault

WhisperVault is a local-first voice journal for iOS and Android. You record a note, the operating system transcribes it on the device, and the transcript is stored in SQLite on the phone. There is no account, no sync, and no cloud speech-to-text.

## Overview

The app targets a person who wants voice notes and transcripts that stay on the device. Expo Go can open the journal, search, and settings. Recording on a phone needs the installed app from `npx expo run:android` or `npx expo run:ios` in Installation. Expo Go does not include that speech recognizer.

Repository: https://github.com/Derugithub/WhisperVault

## Features

- Record a voice note and show a live transcript.
- Transcribe with the on-device operating-system speech recognizer.
- Persist each note in `whispervault.db`.
- List notes and open one to read the transcript.
- Search transcripts with a case-insensitive text match.
- Play a saved recording when the device stored an audio file.
- Change the recognition language in the app.
- Delete one note, or delete all notes.
- Explain how to enable the microphone when permission is denied.
- On Android 13 and later, prompt the system to download an offline speech model the first time a language is used. The app does not fall back to a network recognizer if that model is missing.

Each note row has:

| Field | Meaning |
| --- | --- |
| `id` | Local identifier |
| `createdAt` | When the recording started |
| `transcript` | Text from the on-device recognizer |
| `audioUri` | Optional local recording file, when the device can save one |

## Requirements

- npm, as used by the install and script commands in `package.json`.
- Expo SDK `~57.0.27` (`expo` in `package.json`).
- Expo Go for the note list, search, and settings. Recording on iOS or Android needs a development build from the Installation commands.
- iOS and Android targets declared in `app.json`: bundle identifier and Android package `com.whispervault.app`.
- Assumption: `npx expo run:ios` needs Xcode, and `npx expo run:android` needs an Android SDK. The repository does not document those toolchains.

Node.js version is not pinned in the repository.

## Installation

```bash
npm install
npx expo run:ios
npx expo run:android
```

`package.json` also defines:

```bash
npm start
npm run web
```

`npm start` runs `expo start`. Opening that project in Expo Go shows the journal, search, and settings. Recording on a phone uses `npx expo run:android` or `npx expo run:ios`. `npm run web` runs `expo start --web`.

## Configuration

No environment variable files are in the repository. App config is `app.json`. TypeScript config is `tsconfig.json`. Metro config is `metro.config.js`.

Recognition language is changed in the in-app Settings screen (`src/app/settings.tsx`).

Identifiers and appearance set in `app.json`:

- App name: WhisperVault
- Slug: `whispervault`
- Version: `1.0.0`
- URL scheme: `whispervault`
- `userInterfaceStyle`: `dark`
- iOS `bundleIdentifier`: `com.whispervault.app`
- Android `package`: `com.whispervault.app`
- Adaptive icon and splash background: `#0B0C10`

Microphone and speech-recognition permission strings are set in the `expo-speech-recognition` and `expo-audio` plugin entries in `app.json`. Background recording and background playback are disabled.

`expo-asset` is a direct dependency because `expo-audio` lists it as a peer dependency. `app.json` includes `expo-asset` in `plugins` with no options.

## Usage

Install dependencies and start an iOS development build:

```bash
npm install
npx expo run:ios
```

In the app:

1. Record a note, watch the live transcript, and stop.
2. Open the note and confirm the transcript.
3. Leave the note, reopen the app, and confirm the note is still in the list.
4. Search for a word from the transcript.
5. Play the saved recording when an audio file was stored.
6. Turn on airplane mode and record again. Transcription still finishes on the device.
7. On Android, download the offline speech model if prompted, then record.
8. Deny microphone permission and confirm the app explains how to enable it.
9. Change the recognition language, delete one note, and delete all notes.

## Project structure

```text
app.json
package.json
assets/images/          app icon, adaptive icon, splash, favicon
src/app/                expo-router screens
  index.tsx             note list and search
  record.tsx            recording
  note/[id].tsx         one note
  settings.tsx          language and delete-all
src/db/                 SQLite client and notes repository
src/speech/             recognizer options and capture
src/audio/              local recording files
src/domain/             ids, language, transcript, formatting
src/components/         list, search, playback, layout
```

## Development

Typecheck:

```bash
npm run typecheck
```

Tests (Node test runner, as defined in `package.json`):

```bash
npm test
```

That script runs `src/domain/*.test.ts`, `src/db/*.test.ts`, and `src/speech/*.test.ts`.

## Contributing

No contributing guide is in the repository.

## License

WhisperVault is licensed under the MIT License. See [LICENSE](LICENSE).
