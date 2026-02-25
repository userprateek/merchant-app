export function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`INVALID_${key.toUpperCase()}`);
  }
  return value.trim();
}

export function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function getRequiredNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`INVALID_${key.toUpperCase()}`);
  }
  return numberValue;
}

export function getBooleanFromCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}
