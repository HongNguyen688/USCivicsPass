// parseDialogue: Splits a Mock Interview script into speaking turns.
//
// The scripts are plain text, one line per turn, like:
//   "Officer: What is your full legal name?"
//   "Applicant: Anh Thi Nguyen."
//   "Applicant (standing): Yes, I do."
//
// A line with no "Officer:"/"Applicant:" prefix is a continuation of the
// previous speaker (the oath in section 2 wraps onto its own line), so it is
// appended rather than treated as a new turn. Stage directions in brackets
// are kept for the screen but never spoken.
//
// This lives in its own file because two things have to agree on it exactly:
// App.jsx, which plays the turns back, and scripts/generate-interview-audio.mjs,
// which pre-renders one audio file per turn. The audio files are addressed by
// turn index, so a parser that drifted between the two would put the wrong
// recording against the wrong line.
export const parseDialogue = (text) => {
  const turns = [];

  (text || '').split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const match = line.match(/^(Officer|Applicant)\b([^:]*):\s*(.*)$/i);
    if (match) {
      turns.push({
        speaker: match[1].toLowerCase(),      // 'officer' | 'applicant'
        direction: match[2].trim(),           // e.g. "(standing)" — shown, not spoken
        text: match[3].trim(),
      });
    } else if (turns.length) {
      turns[turns.length - 1].text += ' ' + line;
    } else {
      turns.push({ speaker: 'officer', direction: '', text: line });
    }
  });

  return turns.filter((turn) => turn.text);
};

export default parseDialogue;
