import type { TNullableNumber, TNullableString } from "~/types/common";

export const convertToLowerCase = (word: string) => word.toLowerCase();

export const convertToUpperCase = (word: string) => word.toUpperCase();

export const getStringLength = (text: TNullableString | TNullableNumber | undefined) =>
    text ? String(text).length : 0;

export function capitalizeWord(word: string, onlyFirstLetter = false) {
    const lowercasedWord = word.toLowerCase().trim();
    const splittedBySpace = lowercasedWord.split(" ");
    if (getArrayLength(splittedBySpace) === 0) return lowercasedWord;
    if (
        (getArrayLength(splittedBySpace) === 1 && getStringLength(splittedBySpace[0]) > 0) ||
        onlyFirstLetter
    )
        return `${lowercasedWord[0].toUpperCase()}${lowercasedWord.substring(1)}`;
    if (getArrayLength(splittedBySpace) > 1) {
        let result = "";
        for (const [index, row] of splittedBySpace.entries()) {
            if (getStringLength(row) > 0) {
                if (index === getArrayLength(splittedBySpace) - 1)
                    result += `${row[0].toUpperCase()}${row.substring(1)}`;
                else result += `${row[0].toUpperCase()}${row.substring(1)} `;
            }
        }
        return result;
    }
    return lowercasedWord;
}

export function convertWordsIntoCasedWords(
    word: string,
    type: "camel case" | "pascal case" | "kebab case" | "snake case",
) {
    const splittedBySpace = word.split(" ");
    let result = "";
    for (const [index, row] of splittedBySpace.entries()) {
        switch (type) {
            case "camel case":
                result += index === 0 ? convertToLowerCase(row) : capitalizeWord(row);
                break;
            case "kebab case": {
                const lowercasedWord = convertToLowerCase(row);
                result += index === 0 ? lowercasedWord : `-${lowercasedWord}`;
                break;
            }
            case "snake case": {
                const lowercasedWord = convertToLowerCase(row);
                result += index === 0 ? lowercasedWord : `_${lowercasedWord}`;
                break;
            }
            case "pascal case":
                result += capitalizeWord(row);
                break;
            default:
                result += index === 0 ? row : capitalizeWord(row);
                break;
        }
    }
    return result;
}

export const checkStringFalsy = (value: any) =>
    ["", "null", "undefined", "nan"].includes(String(value).toLowerCase());

export const getDefaultInputValue = (value: string | number | null) =>
    checkShallowFalsy(value) ? "" : value;

export const getEmptyValue = (value: any, emptyType: "-" = "-") =>
    checkStringFalsy(value) ? emptyType : value;

export const compareAsString = (value1: any, value2: any) => String(value1) === String(value2);

export const padCharactersToString = (
    text: string | number,
    type: "start" | "end" = "start",
    padLength: number = 4,
    padCharacter: string = "0",
) =>
    type === "start"
        ? String(text).padStart(padLength, padCharacter)
        : String(text).padEnd(padLength, padCharacter);

export function ellipsedText(text: TNullableString | TNullableNumber) {
    let result = "";
    if (text && getStringLength(text) > 35) result = `${String(text).slice(0, 35)}...`;
    else if (text) result = String(text);
    return result;
}

export const slicedText = (text: string, startIndex: number = 0, endIndex: number = 8) =>
    text.slice(startIndex, endIndex);
