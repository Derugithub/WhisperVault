export type TranscriptState = {
  tally: string;
  display: string;
};

export function createTranscriptState(): TranscriptState {
  return { tally: '', display: '' };
}

function joinUtterance(left: string, right: string): string {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  if (/\s$/.test(left) || /^\s/.test(right)) {
    return left + right;
  }
  return `${left} ${right}`;
}

export function reduceTranscript(
  state: TranscriptState,
  result: { transcript: string; isFinal: boolean },
): TranscriptState {
  const transcript = result.transcript ?? '';
  if (result.isFinal) {
    const tally = joinUtterance(state.tally, transcript);
    return { tally, display: tally };
  }
  return {
    tally: state.tally,
    display: joinUtterance(state.tally, transcript),
  };
}

export function previewTranscript(transcript: string): string {
  return transcript.replace(/\s+/g, ' ').trim();
}
