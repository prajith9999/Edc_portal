/* eslint-disable import/no-named-as-default-member */
import dayjs, { type ManipulateType, type OpUnitType } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import utc from "dayjs/plugin/utc";
import type { IDateTimeFormatDetail, TDateFormat, TNullableDate } from "~/types/common";

dayjs.extend(weekday);
dayjs.extend(utc);

export const currentDate = () => dayjs(new Date());

export const dayjsDate = (date: TNullableDate) => dayjs(date);

export const numberOfDaysInMonth = (date: TNullableDate) => dayjs(date).daysInMonth();

export const weekDay = (date: TNullableDate) => dayjs(date).weekday();

export const addUTCModifierAtTheEnd = (date: TNullableDate, checkForUTCModifier: boolean = true) =>
    String(date).endsWith("Z") || !checkForUTCModifier ? date : `${date}Z`;

export function formatDate(
    date: TNullableDate,
    format: TDateFormat = "YYYY-MM-DD",
    checkForUTCModifier: boolean = true,
) {
    // let result = "";
    // switch (format) {
    //     case "YYYY-MM-DD":
    //         result = dayjs(date).format(format);
    //         break;
    //     default:
    //         result = dayjs(date).format(format);
    //         break;
    // }
    if (!date) return "";
    const result = dayjs(addUTCModifierAtTheEnd(date, checkForUTCModifier)).format(format);
    return result;
}

export const isTodayDate = (date: TNullableDate) => formatDate(date) === formatDate(new Date());

export const subtractDate = (date: TNullableDate, value: number, type: ManipulateType) =>
    dayjs(date).subtract(value, type);

export const addDate = (date: TNullableDate, value: number, type: ManipulateType) =>
    dayjs(date).add(value, type);

export function getYearsList(year: number) {
    const yearPickerValues = [];
    const base = year - (year % 20);
    for (let i = 0; i <= 20; i++) {
        yearPickerValues.push(base + i);
    }
    return yearPickerValues;
}

export const compareDate = (date1: TNullableDate, date2: TNullableDate) =>
    formatDate(date1, "YYYY-MM-DD", false) === formatDate(date2, "YYYY-MM-DD", false);

export function compareUnkownDate(date1: TNullableDate, date2: TNullableDate) {
    const [dateValue = ""] = String(date2).split(" ");
    const [mainYearValue = "", mainMonthValue = "", mainDayValue = ""] = String(date1).split("-");
    const [yearValue = "", monthValue = "", dayValue = ""] = String(dateValue).split("-");
    return isEqual(
        `${mainYearValue}-${padCharactersToString(mainMonthValue, "start", 2)}-${padCharactersToString(mainDayValue, "start", 2)}`,
        `${yearValue}-${["UN", "UNK"].includes(monthValue) ? monthValue : padCharactersToString(monthValue, "start", 2)}-${padCharactersToString(dayValue, "start", 2)}`,
        "string",
    );
}

export const currentEpochTime = () => new Date().getTime();

export const convertToEpochTime = (date: Date | string) => new Date(date).getTime();

export const convertDateTimeToUTC = (date: TNullableDate, format: TDateFormat) =>
    dayjsDate(date).utc().format(format);

export const getAsISOString = (date: TNullableDate, isUTC = false) =>
    isUTC ? dayjsDate(date).utc().toISOString() : dayjsDate(date).toISOString();

export const checkIfDateIsBefore = (
    dateToCheck: TNullableDate,
    refDate: TNullableDate,
    compareType: OpUnitType = "date",
) => dateToCheck && refDate && dayjs(dateToCheck).isBefore(dayjs(refDate), compareType);

export const checkIfDateIsAfter = (
    dateToCheck: TNullableDate,
    refDate: TNullableDate,
    compareType: OpUnitType = "date",
) => dateToCheck && refDate && dayjs(dateToCheck).isAfter(dayjs(refDate), compareType);

export const dateDifference = (
    dateToCheck: TNullableDate,
    refDate: TNullableDate,
    compareType: OpUnitType = "days",
) => dayjs(dateToCheck).diff(dayjs(refDate), compareType);

export function formatUnkownDate(format: string, date: string) {
    const dateTimeDetails = processDateTimeFormat(format);
    const [dateValue = "", timeValue = ""] = String(date).split(" ");
    const [yearValue = "", monthValue = "", dayValue = ""] = dateValue.split("-");
    const [hourValue = "", minuteValue = "", secondValue = ""] = timeValue.split(":");

    let result = dateTimeDetails.fullFormat.formatted;
    if (dayValue)
        result = dateTimeDetails.fullFormat.formatted.replace(
            "DD",
            padCharactersToString(dayValue, "start", 2),
        );
    if (monthValue && result.includes("MMM")) result = result.replace("MMM", monthValue);
    else if (monthValue)
        result = result.replace("MM", padCharactersToString(monthValue, "start", 2));
    if (yearValue) result = result.replace("YYYY", yearValue);
    if (hourValue) result = result.replace("HH", hourValue);
    if (minuteValue) result = result.replace("mm", minuteValue);
    if (secondValue) result = result.replace("ss", secondValue);
    return result;
}

function checkTheFormatType(format: string) {
    let result: "day" | "month" | "year" | "hour" | "minute" | "second" | "timeOfTheDay" | "" = "";
    switch (format) {
        case "DD":
        case "DD?":
            result = "day";
            break;
        case "MM":
        case "MMM":
        case "MM?":
        case "MMM?":
            result = "month";
            break;
        case "YY":
        case "YYYY":
            result = "year";
            break;
        case "HH":
            result = "hour";
            break;
        case "mm":
            result = "minute";
            break;
        case "ss":
            result = "second";
            break;
        case "A":
            result = "timeOfTheDay";
            break;
    }
    return result;
}

function processDateTimeFormatDetails(
    dateTimeFormatDetails: IDateTimeFormatDetail,
    format: string,
    order: number,
) {
    const formatResult = checkTheFormatType(format);
    if (!formatResult) return false;
    if (formatResult === "day") {
        dateTimeFormatDetails.day.original = format;
        dateTimeFormatDetails.day.formatted = format.replace("?", "");
        dateTimeFormatDetails.day.order = order;
    } else if (formatResult === "month") {
        dateTimeFormatDetails.month.original = format;
        dateTimeFormatDetails.month.formatted = format.replace("?", "");
        dateTimeFormatDetails.day.order = order;
    } else {
        dateTimeFormatDetails[formatResult].original = format;
        dateTimeFormatDetails[formatResult].formatted = format;
        dateTimeFormatDetails.day.order = order;
    }
}

export const defaultDateTimeFormatDetails = (): IDateTimeFormatDetail => ({
    day: { formatted: "", original: "", order: 0 },
    month: { formatted: "", original: "", order: 0 },
    year: { formatted: "", original: "", order: 0 },
    hour: { formatted: "", original: "", order: 0 },
    minute: { formatted: "", original: "", order: 0 },
    second: { formatted: "", original: "", order: 0 },
    timeOfTheDay: { formatted: "", original: "", order: 0 },
    seperator: { date: "", time: "" },
    fullFormat: { formatted: "", original: "", order: 0 },
});

export function processDateTimeFormat(dateFormat: string): IDateTimeFormatDetail {
    // Date = D, DD
    // Month = M, MM, MMM, MMMM
    // Year = YY, YYYY
    // Hour = H, HH, h, hh
    // Minute = m, mm
    // Second = s, ss
    // Milliseconds = SSS
    // Time of the day = a, A
    // date seperator = "-", "/", " "
    // time seperator = ":"
    // dd mm yy hh:ss:mm a
    const dateTimeFormatDetails: IDateTimeFormatDetail = { ...defaultDateTimeFormatDetails() };
    if (String(dateFormat).includes("-")) dateTimeFormatDetails.seperator.date = "-";
    else if (String(dateFormat).includes("/")) dateTimeFormatDetails.seperator.date = "/";
    else if (String(dateFormat).includes(" ")) dateTimeFormatDetails.seperator.date = " ";
    dateTimeFormatDetails.seperator.time = ":";
    dateTimeFormatDetails.fullFormat.original = dateFormat;
    dateTimeFormatDetails.fullFormat.formatted = dateFormat.replaceAll("?", "");
    const isDatePresent =
        dateFormat.includes("DD") ||
        dateFormat.includes("MM") ||
        dateFormat.includes("MMM") ||
        dateFormat.includes("YY") ||
        dateFormat.includes("YYYY");
    const isTimePresent =
        dateFormat.includes("HH") || dateFormat.includes("mm") || dateFormat.includes("ss");
    const isTimeMeridianPresent = dateFormat.includes("A");
    const splittedFormats = String(dateFormat).split(" ");
    let firstFormat = "";
    let secondFormat = "";
    let thirdFormat = "";
    let fourthFormat = "";
    let fifthFormat = "";
    let sixthFormat = "";
    let seventhFormat = "";

    let firstOrder = 0;
    let secondOrder = 0;
    let thirdOrder = 0;
    let fourthOrder = 0;
    let fifthOrder = 0;
    let sixthOrder = 0;
    let seventhOrder = 0;

    if (isDatePresent && isTimePresent && isTimeMeridianPresent) {
        // dd-mm-yy hh:mm:ss a
        // dd mm yy hh:mm:ss a
        // 3 or 5
        if (getArrayLength(splittedFormats) === 3) {
            const [date = "", time = "", timeOfTheDay = ""] = splittedFormats;
            const [dateFirst = "", dateSecond = "", dateThird = ""] = date.split(
                dateTimeFormatDetails.seperator.date,
            );
            const [timeFirst = "", timeSecond = "", timeThird = ""] = time.split(
                dateTimeFormatDetails.seperator.time,
            );
            firstFormat = dateFirst;
            secondFormat = dateSecond;
            thirdFormat = dateThird;
            fourthFormat = timeFirst;
            fifthFormat = timeSecond;
            sixthFormat = timeThird;
            seventhFormat = timeOfTheDay;
            firstOrder = 1;
            secondOrder = 2;
            thirdOrder = 3;
            fourthOrder = 4;
            fifthOrder = 5;
            sixthOrder = 6;
            seventhOrder = 7;
        } else if (getArrayLength(splittedFormats) === 5) {
            const [dateFirst = "", dateSecond = "", dateThird = "", time = "", timeOfTheDay = ""] =
                splittedFormats;
            const [timeFirst = "", timeSecond = "", timeThird = ""] = time.split(
                dateTimeFormatDetails.seperator.time,
            );
            firstFormat = dateFirst;
            secondFormat = dateSecond;
            thirdFormat = dateThird;
            fourthFormat = timeFirst;
            fifthFormat = timeSecond;
            sixthFormat = timeThird;
            seventhFormat = timeOfTheDay;
            firstOrder = 1;
            secondOrder = 2;
            thirdOrder = 3;
            fourthOrder = 4;
            fifthOrder = 5;
            sixthOrder = 6;
            seventhOrder = 7;
        }
    } else if (isDatePresent && isTimePresent) {
        // dd-mm-yy hh:mm:ss
        // dd mm yy hh:mm:ss
        // 2 or 4
        if (getArrayLength(splittedFormats) === 2) {
            const [date = "", time = ""] = splittedFormats;
            const [dateFirst = "", dateSecond = "", dateThird = ""] = date.split(
                dateTimeFormatDetails.seperator.date,
            );
            const [timeFirst = "", timeSecond = "", timeThird = ""] = time.split(
                dateTimeFormatDetails.seperator.time,
            );
            firstFormat = dateFirst;
            secondFormat = dateSecond;
            thirdFormat = dateThird;
            fourthFormat = timeFirst;
            fifthFormat = timeSecond;
            sixthFormat = timeThird;
            firstOrder = 1;
            secondOrder = 2;
            thirdOrder = 3;
            fourthOrder = 4;
            fifthOrder = 5;
            sixthOrder = 6;
        } else if (getArrayLength(splittedFormats) === 4) {
            const [dateFirst = "", dateSecond = "", dateThird = "", time = ""] = splittedFormats;
            const [timeFirst = "", timeSecond = "", timeThird = ""] = time.split(
                dateTimeFormatDetails.seperator.time,
            );
            firstFormat = dateFirst;
            secondFormat = dateSecond;
            thirdFormat = dateThird;
            fourthFormat = timeFirst;
            fifthFormat = timeSecond;
            sixthFormat = timeThird;
            firstOrder = 1;
            secondOrder = 2;
            thirdOrder = 3;
            fourthOrder = 4;
            fifthOrder = 5;
            sixthOrder = 6;
        }
    } else if (isDatePresent && !isTimePresent) {
        // dd-mm-yy
        // dd mm yy
        // 1 or 3
        if (getArrayLength(splittedFormats) === 1) {
            const [date = ""] = splittedFormats;
            const [dateFirst = "", dateSecond = "", dateThird = ""] = date.split(
                dateTimeFormatDetails.seperator.date,
            );
            firstFormat = dateFirst;
            secondFormat = dateSecond;
            thirdFormat = dateThird;
            firstOrder = 1;
            secondOrder = 2;
            thirdOrder = 3;
        } else if (getArrayLength(splittedFormats) === 3) {
            const [dateFirst = "", dateSecond = "", dateThird = ""] = splittedFormats;
            firstFormat = dateFirst;
            secondFormat = dateSecond;
            thirdFormat = dateThird;
            firstOrder = 1;
            secondOrder = 2;
            thirdOrder = 3;
        }
    } else if (!isDatePresent && isTimePresent && isTimeMeridianPresent) {
        // hh:mm:ss a
        // 2
        if (getArrayLength(splittedFormats) === 2) {
            const [time = "", timeOfTheDay = ""] = splittedFormats;
            const [timeFirst = "", timeSecond = "", timeThird = ""] = time.split(
                dateTimeFormatDetails.seperator.time,
            );
            fourthFormat = timeFirst;
            fifthFormat = timeSecond;
            sixthFormat = timeThird;
            seventhFormat = timeOfTheDay;
            fourthOrder = 4;
            fifthOrder = 5;
            sixthOrder = 6;
            seventhOrder = 7;
        }
    } else if (!isDatePresent && isTimePresent) {
        // hh:mm:ss
        // 1
        if (getArrayLength(splittedFormats) === 1) {
            const [time = ""] = splittedFormats;
            const [timeFirst = "", timeSecond = "", timeThird = ""] = time.split(
                dateTimeFormatDetails.seperator.time,
            );
            fourthFormat = timeFirst;
            fifthFormat = timeSecond;
            sixthFormat = timeThird;
            fourthOrder = 4;
            fifthOrder = 5;
            sixthOrder = 6;
        }
    }
    processDateTimeFormatDetails(dateTimeFormatDetails, firstFormat, firstOrder);
    processDateTimeFormatDetails(dateTimeFormatDetails, secondFormat, secondOrder);
    processDateTimeFormatDetails(dateTimeFormatDetails, thirdFormat, thirdOrder);
    processDateTimeFormatDetails(dateTimeFormatDetails, fourthFormat, fourthOrder);
    processDateTimeFormatDetails(dateTimeFormatDetails, fifthFormat, fifthOrder);
    processDateTimeFormatDetails(dateTimeFormatDetails, sixthFormat, sixthOrder);
    processDateTimeFormatDetails(dateTimeFormatDetails, seventhFormat, seventhOrder);
    return deepClone(dateTimeFormatDetails);
}

export const isValidDate = (date: string) => checkIfValidNumber(Date.parse(date));
