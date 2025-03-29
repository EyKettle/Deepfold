export function separateValueAndUnit(
  cssValue: string
): { value: number; unit: string } | null {
  const match = cssValue.match(/^(\d+(\.\d*)?|\.\d+)([a-zA-Z%]+)?$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[3] || "";
    return { value, unit };
  }
  return null;
}

export function initReport() {
  console.error("Not initialized");
}
