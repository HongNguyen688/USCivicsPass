// formatSmartAnswer: Intelligently formats the answer for flashcards.
// Some questions ask "Name THREE branches..." — this function picks
// the right number of answers from the semicolon-separated list.
// Example input: "executive; legislative; judicial"
// If question says "three", returns: "executive, legislative, and judicial"
//
// This lives in its own file for the same reason as parseDialogue: the audio
// generator has to produce a recording of the exact string the app will speak,
// and Flashcards speaks this function's output rather than the raw answer.
export const formatSmartAnswer = (answerStr, question) => {
  // Detect how many answers the question requires
  const getCount = (q) => {
    const lowerCaseQ = q.toLowerCase();
    if (lowerCaseQ.includes('three') || lowerCaseQ.includes('3 ') || lowerCaseQ.includes(' 3')) return 3;
    if (lowerCaseQ.includes('two') || lowerCaseQ.includes('2 ') || lowerCaseQ.includes(' 2')) return 2;
    return 1; // Default: just show 1 answer
  };

  const count = getCount(question);

  // Split "answer1; answer2; answer3" into ["answer1", "answer2", "answer3"]
  const parts = answerStr.split(';').map(p => p.trim());

  if (parts.length <= 1) return parts[0]; // Only one answer, return it directly

  // Take only as many answers as the question requires
  const selected = parts.slice(0, count);

  // Format with proper English grammar:
  if (selected.length === 1) return selected[0];
  if (selected.length === 2) return `${selected[0]} and ${selected[1]}`;
  // 3 or more: "a, b, and c"
  return `${selected.slice(0, -1).join(', ')}, and ${selected[selected.length - 1]}`;
};

export default formatSmartAnswer;
