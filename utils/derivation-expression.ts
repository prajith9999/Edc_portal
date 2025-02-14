import type { TNullableNumber, TNullableString } from "~/types/common";
import type { IDataCollectionFormDetails } from "~/types/form-generation";

export interface IExpressionFormat {
    type: string;
    afterDecimalPlace: number;
    maxCharacterLength: number;
}
export function convertExpressionResultToDefinedFormat(
    dataCollectionDetails: IDataCollectionFormDetails,
) {
    const result: IExpressionFormat = {
        type: "",
        afterDecimalPlace: -1,
        maxCharacterLength: -1,
    };
    if (dataCollectionDetails.format) {
        if (dataCollectionDetails.format.includes(".")) {
            result.type = "number";
            const splittedString = dataCollectionDetails.format.split(".");
            result.afterDecimalPlace = Number(splittedString[getArrayLength(splittedString) - 1]);
        } else if (dataCollectionDetails.format.includes("$")) {
            result.type = "string";
            const splittedString = dataCollectionDetails.format.split("$");
            result.maxCharacterLength = Number(splittedString[getArrayLength(splittedString) - 1]);
        } else {
            result.type = "number";
        }
    }
    return result;
}

export function BMI(
    weight: TNullableNumber | TNullableString,
    height: TNullableNumber | TNullableString,
    unit: TNullableString,
) {
    if (weight && height) {
        const heightInMeter = unit === "cm" ? Number(height) / 100 : Number(height);
        return Number(weight) / (heightInMeter * heightInMeter);
    }
    return null;
}

export function BSA(
    weight: TNullableNumber | TNullableString,
    height: TNullableNumber | TNullableString,
) {
    if (weight && height) {
        return Math.sqrt((Number(weight) * Number(height)) / 3600);
    }
    return null;
}

export function TotalSum(sums: number[]) {
    if (sums && getArrayLength(sums) > 0) {
        let result = 0;
        for (const sum of sums) {
            if (sum) result += Number(sum);
        }
        return result;
    }
    return null;
}

export function Mean(scores: number[]) {
    if (scores && getArrayLength(scores) > 0) {
        let result = 0;
        for (const score of scores) {
            if (score) result += Number(score);
        }
        return result ? result / getArrayLength(scores) : 0;
    }
    return null;
}

export function FetchValue(fieldValue: any) {
    if (fieldValue) return fieldValue;
    return null;
}
