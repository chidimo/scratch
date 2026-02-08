export const mergeClasses = (
  ...classes: Array<string | false | null | undefined>
) => classes.filter(Boolean).join(' ');
