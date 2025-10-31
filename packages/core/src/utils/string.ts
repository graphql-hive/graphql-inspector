import inspect from 'object-inspect';

export interface Target {
  typeId: string;
  value: string;
}

export interface Rating {
  target: Target;
  rating: number;
}

export interface BestMatch {
  ratings: Rating[];
  bestMatch: Rating;
}

function compareTwoStrings(str1: string, str2: string) {
  if (!str1.length && !str2.length) return 1;
  if (!str1.length || !str2.length) return 0;
  if (str1.toUpperCase() === str2.toUpperCase()) return 1;
  if (str1.length === 1 && str2.length === 1) return 0;

  const pairs1 = wordLetterPairs(str1);
  const pairs2 = wordLetterPairs(str2);
  const union = pairs1.length + pairs2.length;
  let intersection = 0;
  for (const pair1 of pairs1) {
    for (let i = 0, pair2; (pair2 = pairs2[i]); i++) {
      if (pair1 !== pair2) continue;
      intersection++;
      pairs2.splice(i, 1);
      break;
    }
  }
  return (intersection * 2) / union;
}

export function findBestMatch(mainString: string, targetStrings: Target[]): BestMatch {
  if (!areArgsValid(mainString, targetStrings))
    throw new Error(
      'Bad arguments: First argument should be a string, second should be an array of strings',
    );
  const ratings = targetStrings.map(target => ({
    target,
    rating: compareTwoStrings(mainString, target.value),
  }));
  const bestMatch = Array.from(ratings).sort((a, b) => b.rating - a.rating)[0];
  return { ratings, bestMatch };
}

function flattenDeep(arr: any): string[] {
  return Array.isArray(arr) ? arr.reduce((a, b) => a.concat(flattenDeep(b)), []) : [arr];
}

function areArgsValid(mainString: string, targetStrings: Target[]) {
  if (typeof mainString !== 'string') return false;
  if (!Array.isArray(targetStrings)) return false;
  if (!targetStrings.length) return false;
  if (targetStrings.find(s => typeof s.value !== 'string')) return false;
  return true;
}

function letterPairs(str: string) {
  const pairs = [];
  for (let i = 0, max = str.length - 1; i < max; i++) pairs[i] = str.substring(i, i + 2);
  return pairs;
}

function wordLetterPairs(str: string) {
  const pairs = str.toUpperCase().split(' ').map(letterPairs);
  return flattenDeep(pairs);
}

export function safeString(obj: unknown) {
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  return inspect(obj)
    .replace(/\[Object: null prototype\] /g, '')
    .replace(/(^')|('$)/g, '');
}

export function fmt(reason: string): string {
  return reason.replace(/'/g, "\\'");
}
