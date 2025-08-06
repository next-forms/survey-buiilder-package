// Utility to generate unique field names
export const generateFieldName = (prefix: string): string => {
  const timestamp = Date.now().toString(36).substring(4, 7);
  const random = Math.random().toString(36).substring(2, 5);
  return `${prefix}${timestamp}${random}`;
};