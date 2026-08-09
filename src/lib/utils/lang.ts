// src/lib/utils/lang.ts

export type Gender = 'k' | 'm' | 'f';

export type PolishDictionary = Record<string, Record<Gender, string>>;

export function createPolish(words: PolishDictionary) {
    function capitalize(value: string): string {
        if(!value) return '';

        return value[0].toUpperCase() + value.slice(1);
    }

    function gendered(key: string, gender: Gender, withCapitalization = true): string {
        const value = words[key]?.[gender] ?? key;

        return withCapitalization ? capitalize(value) : value;
    }

    return { gendered };
}