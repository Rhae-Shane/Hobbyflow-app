export function formatClarificationAnswer(selectedChips: string[], freeText: string): string {
  const chipLines = selectedChips
    .map((chip) => `- ${chip.trim()}`)
    .filter((line) => line.length > 2);
  const text = freeText.trim();
  return [...chipLines, ...(text ? [text] : [])].join('\n');
}
