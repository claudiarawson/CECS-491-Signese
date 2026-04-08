export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateTypedAnswer(
  input: string,
  acceptedAnswers: string[]
): boolean {
  const normalizedInput = normalizeAnswer(input);
  return acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizedInput);
}
