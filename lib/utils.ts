export { cn } from "cn";

export const plural = (count: number, word: string, pluralWord: string) => {
  return count === 1 ? word : pluralWord;
};
