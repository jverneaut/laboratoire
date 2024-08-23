export const camelCaseToKebabCase = (string) =>
  string
    .split('')
    .map((char) =>
      char.toUpperCase() === char ? '-' + char.toLowerCase() : char
    )
    .join('');

export const combineClassNames = (strings) => {
  return strings.filter((str) => str.trim() !== '').join(' ');
};
