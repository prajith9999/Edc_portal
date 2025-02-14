<script setup lang="ts">
    // @ts-nocheck
    import { TIME_OPTIONS } from "~/constants/options";
    import type { TDateFormat, TNullableDate } from "~/types/common";
    import type { ICalendarProps, TFloatingDropdownPlacement } from "~/types/form-generation";
    import { useFloating, offset, autoUpdate, flip, shift } from "@floating-ui/vue";
    import { isTodayDate } from "#imports";

    interface IDay {
        date: string;
        isToday: boolean;
        isCurrentMonth: boolean;
        disabled: boolean;
    }

    type TViewMode = "date" | "month" | "year";
    type TTimeType = "hour" | "minute" | "second";

    const modelValue = defineModel<TNullableDate>({
        default: null,
    });

    const emit = defineEmits<{
        "on-model-change": [];
        "on-clear": [];
    }>();

    const props = withDefaults(defineProps<ICalendarProps>(), {
        containerClass: "",
        disabled: false,
        elementId: "",
        type: "date",
        format: "DD-MMM-YYYY",
        error: "",
        inputClass: "",
        label: "",
        labelClass: "",
        pickerPosition: "auto",
        pickerPlacement: undefined,
        pickerOffset: 0,
        pickerClass: "",
        readOnly: false,
        required: false,
        placeholder: "Choose a date",
        disabledDates: () => [],
        minDate: undefined,
        maxDate: undefined,
        showHelpText: false,
        helpText: null,
        labelContainerClass: "",
        isDateTime: true,
        tabindex: undefined,
        showCharacterCount: false,
    });

    const showPicker = ref<boolean>(false);
    const calendarPickerContainer = ref(null);
    const calendarPicker = ref(null);
    const pickerPlacementRef = ref<TFloatingDropdownPlacement | undefined>(props.pickerPlacement);
    const inputRef = ref(null);

    const { floatingStyles } = useFloating(calendarPickerContainer, calendarPicker, {
        transform: false,
        middleware: [offset(props.pickerOffset), flip(), shift()],
        placement: pickerPlacementRef, // props.pickerPlacement,
        whileElementsMounted: autoUpdate,
    });

    const targetIsVisible = useElementVisibility(calendarPickerContainer);

    const viewMode = ref<TViewMode>("date");
    const selectedDate = ref<TNullableDate>(null);
    const originalValue = ref<TNullableDate>(null);
    const selectedMonth = ref<number>(0);
    const selectedYear = ref<string>("");
    const weeksList = ref<string[]>(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    const monthsList = ref<string[]>([
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]);
    const yearsList = ref<number[]>([]);
    const hoursList = ref<string[]>(TIME_OPTIONS("hours"));
    const minutesList = ref<string[]>(TIME_OPTIONS("minutes"));
    const secondsList = ref<string[]>(TIME_OPTIONS("seconds"));
    // const daysList = ref<IDay[]>([]);
    const isTabNavigating = ref<boolean>(false);
    const focusAfterSelecting = ref<boolean>(false);

    const {
        index: monthIndex,
        state: monthState,
        next: goToNextMonth,
        prev: goToPrevMonth,
        go: goToMonth,
    } = useCycleList(monthsList.value);
    const {
        state: hourState,
        next: goToNextHour,
        prev: goToPrevHour,
    } = useCycleList(hoursList.value);
    const {
        state: minuteState,
        next: goToNextMinute,
        prev: goToPrevMinute,
    } = useCycleList(minutesList.value);
    const {
        state: secondState,
        next: goToNextSecond,
        prev: goToPrevSecond,
    } = useCycleList(secondsList.value);

    const getInputId = useMemoize(
        () => props.elementId || convertWordsIntoCasedWords(props.label, "camel case"),
    );
    const containerClasses = computed(() => `container ${props.containerClass}`.trim());
    const pickerFloatingClasses = computed(() => ({
        "picker-container transition-all box-shadow-mild absolute left-0 bg-[var(--color-white)] z-[1000] rounded-[0.5rem] flex flex-col gap-[2rem] p-[1rem]":
            true,
        [props.pickerClass]: props.pickerClass,
        "w-[30rem]": !props.pickerClass,
    }));
    const calendarHeaderLabels = computed(() => ({
        "font-13 lg:font-14": !props.labelClass.includes("admin-input-font"),
        "font-13": props.labelClass.includes("admin-input-font"),
    }));
    const calendarBodyLabels = computed(() => ({
        "font-12 lg:font-13": !props.labelClass.includes("admin-input-font"),
        "font-12": props.labelClass.includes("admin-input-font"),
    }));
    const inputClasses = computed(() => ({
        "input-value form-input": true,
        [props.inputClass]: props.inputClass,
        "input-font": !props.inputClass.includes("font"),
        "readonly-form-input pointer-events-none resize-none": props.readOnly,
    }));

    const dateTimeFormatDetails = computed(() => {
        const result = processDateTimeFormat(props.format);
        if (result.month.original.includes("?")) monthsList.value.push("Unknown");
        return result;
    });
    const isUnknownPossibleForDay = computed(() =>
        dateTimeFormatDetails.value.day.original.includes("?"),
    );
    const isUnknownPossibleForMonth = computed(() =>
        dateTimeFormatDetails.value.month.original.includes("?"),
    );
    const isTimeInFormat = computed(
        () =>
            getStringLength(dateTimeFormatDetails.value.hour.original) > 0 ||
            getStringLength(dateTimeFormatDetails.value.minute.original) > 0 ||
            getStringLength(dateTimeFormatDetails.value.second.original) > 0,
    );

    const getInputValue = computed(() => {
        // modelValue.value ? formatDate(modelValue.value, props.format) : props.placeholder,
        let result = null;
        if (modelValue.value) {
            if (
                (isUnknownPossibleForDay.value || isUnknownPossibleForMonth.value) &&
                typeof modelValue.value === "string" &&
                (modelValue.value.includes("UN") ||
                    modelValue.value.includes("UNK") ||
                    monthState.value === "Unknown")
            ) {
                let dateValueRef = "";
                let monthValueRef = "";
                let yearValueRef = "";
                let hourValueRef = "";
                let minuteValueRef = "";
                let secondValueRef = "";
                const [firstValue = "", secondValue = "", thirdValue = "", fourthValue = ""] =
                    modelValue.value.split(dateTimeFormatDetails.value.seperator.date);
                if (fourthValue) {
                    const [subFirstValue = "00", subSecondValue = "00", subThirdValue = "00"] =
                        fourthValue.split(dateTimeFormatDetails.value.seperator.time);
                    dateValueRef = getStringLength(firstValue) === 4 ? thirdValue : firstValue;
                    monthValueRef = secondValue;
                    yearValueRef = getStringLength(thirdValue) === 4 ? thirdValue : firstValue;
                    hourValueRef = subFirstValue;
                    minuteValueRef = subSecondValue;
                    secondValueRef = subThirdValue;
                } else {
                    const [subFirstValue = "", subSecondValue = ""] = thirdValue.split(" ");
                    const [
                        nestedFirstValue = "00",
                        nestedSecondValue = "00",
                        nestedThirdValue = "00",
                    ] = subSecondValue.split(dateTimeFormatDetails.value.seperator.time);
                    dateValueRef = getStringLength(firstValue) === 4 ? subFirstValue : firstValue;
                    monthValueRef = secondValue;
                    yearValueRef =
                        getStringLength(subFirstValue) === 4 ? subFirstValue : firstValue;
                    hourValueRef = nestedFirstValue;
                    minuteValueRef = nestedSecondValue;
                    secondValueRef = nestedThirdValue;
                }
                if (isTimeInFormat.value)
                    result = `${[dateValueRef === "UN" ? dateValueRef : formatDate(`2024-01-${dateValueRef}`, dateTimeFormatDetails.value.day.formatted as TDateFormat), monthState.value === "Unknown" ? (dateTimeFormatDetails.value.month.formatted === "MMM" ? "UNK" : "UN") : formatDate(`2024-${monthValueRef}-01`, dateTimeFormatDetails.value.month.formatted as TDateFormat), formatDate(`${monthState.value === "Unknown" ? selectedYear.value : yearValueRef}-01-01`, dateTimeFormatDetails.value.year.formatted as TDateFormat)].join(dateTimeFormatDetails.value.seperator.date)} ${hourValueRef}:${minuteValueRef}${dateTimeFormatDetails.value.second.formatted ? `:${secondValueRef}` : ""}`;
                else
                    result = `${[dateValueRef === "UN" ? dateValueRef : formatDate(`2024-01-${dateValueRef}`, dateTimeFormatDetails.value.day.formatted as TDateFormat), monthState.value === "Unknown" || ["UK", "UNK"].includes(monthValueRef) ? (dateTimeFormatDetails.value.month.formatted === "MMM" ? "UNK" : "UN") : formatDate(`2024-${monthValueRef}-01`, dateTimeFormatDetails.value.month.formatted as TDateFormat), formatDate(`${monthState.value === "Unknown" ? selectedYear.value : yearValueRef}-01-01`, dateTimeFormatDetails.value.year.formatted as TDateFormat)].join(dateTimeFormatDetails.value.seperator.date)}`;
            } else
                result = formatDate(
                    modelValue.value,
                    dateTimeFormatDetails.value.fullFormat.formatted as TDateFormat,
                    false,
                );
        }
        return result;
    });

    const formattedDisabledDates = computed(() =>
        props.disabledDates.map((row) => formatDate(row, "YYYY-MM-DD", false)),
    );

    const timeColonDetails = computed(() => {
        let showColorBetweenHourAndMinute = true;
        let showColorBetweenMinuteAndSecond = true;
        // h : m : s
        if (
            getStringLength(dateTimeFormatDetails.value.hour.original) === 0 &&
            getStringLength(dateTimeFormatDetails.value.minute.original) === 0 &&
            getStringLength(dateTimeFormatDetails.value.second.original) === 0
        ) {
            showColorBetweenHourAndMinute = false;
            showColorBetweenMinuteAndSecond = false;
        } else if (
            getStringLength(dateTimeFormatDetails.value.hour.original) > 0 &&
            getStringLength(dateTimeFormatDetails.value.minute.original) === 0 &&
            getStringLength(dateTimeFormatDetails.value.second.original) === 0
        ) {
            showColorBetweenHourAndMinute = false;
            showColorBetweenMinuteAndSecond = false;
        } else if (
            getStringLength(dateTimeFormatDetails.value.hour.original) === 0 ||
            (getStringLength(dateTimeFormatDetails.value.hour.original) > 0 &&
                getStringLength(dateTimeFormatDetails.value.minute.original) === 0)
        )
            showColorBetweenHourAndMinute = false;
        else if (getStringLength(dateTimeFormatDetails.value.second.original) === 0)
            showColorBetweenMinuteAndSecond = false;
        return { showColorBetweenHourAndMinute, showColorBetweenMinuteAndSecond };
    });

    const processPickerWidth = computed(() => {
        let width = 0;
        if (calendarPickerContainer.value) {
            width = (calendarPickerContainer.value as HTMLElement).getBoundingClientRect().width;
        }
        return width;
    });

    const checkIfDateIsDisabled = (date: string) => {
        let result = false;
        const formattedDate = formatDate(date, "YYYY-MM-DD", false);
        if (formattedDisabledDates.value.includes(formattedDate)) result = true;
        else if (props.minDate && checkIfDateIsBefore(formattedDate, props.minDate)) result = true;
        else if (props.maxDate && checkIfDateIsAfter(formattedDate, props.maxDate)) result = true;
        return result;
    };

    
    const currentMonthDays = computed(() => {
        const result: IDay[] = [];
        // const daysInMonth = numberOfDaysInMonth(selectedDate.value);
        const daysInMonth = numberOfDaysInMonth(`${selectedYear.value}-${selectedMonth.value}-01`);
        for (let i = 1; i <= daysInMonth; i++) {
            const selectedMonthText =
                isUnknownPossibleForMonth.value &&
                dateTimeFormatDetails.value.month.formatted === "MM" &&
                selectedMonth.value === 13
                    ? "UN"
                    : isUnknownPossibleForMonth.value &&
                        dateTimeFormatDetails.value.month.formatted === "MMM" &&
                        selectedMonth.value === 13
                      ? "UNK"
                      : selectedMonth.value;
            const date = `${selectedYear.value}-${selectedMonthText}-${i}`;
            // console.log("i in currentMonthDays", i);
            // console.log("date in currentMonthDays", date);
            result.push({
                date:
                    isUnknownPossibleForMonth.value && selectedMonth.value === 13
                        ? date
                        : formatDate(date, "YYYY-MM-DD", false),
                isCurrentMonth: true,
                isToday: isTodayDate(date),
                disabled: checkIfDateIsDisabled(date),
            });
        }
        if (isUnknownPossibleForDay.value)
            result.push({
                date: `${selectedYear.value}-${selectedMonth.value}-UN`,
                isCurrentMonth: true,
                isToday: false,
                disabled: false,
            });
        return deepClone(result) as IDay[];
    });
    
    const previousMonthDays = computed(() => {
        const firstDayOfTheMonthWeekday = weekDay(currentMonthDays.value[0].date);
        const previousMonth = subtractDate(
            `${selectedYear.value}-${selectedMonth.value}-01`,
            1,
            "month",
        );
        
        // console.log("result in previousMonthDays", result);
        // return deepClone(result) as IDay[];
        const visibleNumberOfDaysFromPreviousMonth =
            // firstDayOfTheMonthWeekday === 0 ? firstDayOfTheMonthWeekday - 1 : 6;
            firstDayOfTheMonthWeekday === 0 ? 6 : firstDayOfTheMonthWeekday - 1;
       
        const previousDaysInMonth = numberOfDaysInMonth(
            `${previousMonth.year()}-${previousMonth.month() + 1}-01`,
        );
        const result: IDay[] = [];
        for (let i = 0; i < firstDayOfTheMonthWeekday; i++) {
            
            const date = `${previousMonth.year()}-${previousMonth.month() + 1}-${previousDaysInMonth - (visibleNumberOfDaysFromPreviousMonth - i)}`;
            result.push({
                date: formatDate(date, "YYYY-MM-DD", false),
                isCurrentMonth: false,
                isToday: false,
                disabled: checkIfDateIsDisabled(date),
            });
        }
        return deepClone(result) as IDay[];
    });

    
    const nextMonthDays = computed(() => {
       
        const nextMonth = addDate(`${selectedYear.value}-${selectedMonth.value}-01`, 1, "month");

        const totalDaysInGrid = 42; // 6 rows * 7 columns = 42 days
        const remainingDaysCount =
            totalDaysInGrid -
            (getArrayLength(previousMonthDays.value) + getArrayLength(currentMonthDays.value));

        
        const result: IDay[] = [];

        
        for (let i = 1; i <= remainingDaysCount; i++) {
            const date = `${nextMonth.year()}-${nextMonth.month() + 1}-${i}`;
            result.push({
                date: formatDate(date, "YYYY-MM-DD", false),
                isCurrentMonth: false,
                isToday: false,
                disabled: checkIfDateIsDisabled(date),
            });
        }

        return deepClone(result) as IDay[];
    });

    const daysList = computed(() => [
        ...previousMonthDays.value,
        ...currentMonthDays.value,
        ...nextMonthDays.value,
    ]);

   

    const togglePicker = (defaultValue: boolean | string = "") =>
        typeof defaultValue === "boolean"
            ? (showPicker.value = defaultValue)
            : (showPicker.value = !showPicker.value);

    onClickOutside(
        calendarPickerContainer,
        () => {
            if (showPicker.value) modelValue.value = originalValue.value;
            togglePicker(false);
        },
        {
            ignore: [calendarPicker],
        },
    );
    watch(showPicker, (newShowOptions) => {
        if (newShowOptions && !props.pickerPlacement) {
            calculateElementBounding();
        } else if (newShowOptions && props.pickerPlacement) {
            calculateFloatingElementBounding();
        }
    });
   
    function calculateElementBounding() {
        setTimeout(() => {
            const dropdownOptions = getDOMElement("div.picker-container");
            const dropdownHeight = dropdownOptions.clientHeight;
            const windowHeight = window.innerHeight;
            const calendarContainer = getDOMElement("div.calendar-container");
            const calendarTop = calendarContainer
                ? calendarContainer.getBoundingClientRect().top
                : 0;
            if (props.pickerPosition === "top") {
                // show in top
                dropdownOptions.style.bottom = "100%";
                dropdownOptions.style.top = "auto";
            } else if (props.pickerPosition === "bottom") {
                dropdownOptions.style.bottom = "auto";
                dropdownOptions.style.top = "100%";
            } else if (windowHeight - calendarTop < dropdownHeight) {
                // show in top
                dropdownOptions.style.bottom = "100%";
                dropdownOptions.style.top = "auto";
            } else {
                dropdownOptions.style.bottom = "auto";
                dropdownOptions.style.top = "100%";
            }
        }, 10);
    }
    function calculateFloatingElementBounding() {
        setTimeout(() => {
            if (calendarPicker.value && calendarPickerContainer.value) {
                const dropdownOptions = calendarPicker.value as HTMLElement;
                const dropdownHeight = dropdownOptions.clientHeight;
                const windowHeight = window.innerHeight;
                const dropdownTop = (
                    calendarPickerContainer.value as HTMLElement
                ).getBoundingClientRect().top;
                
                if (windowHeight - dropdownTop < dropdownHeight) {
                    // show in top
                    if (
                        pickerPlacementRef.value &&
                        !["right", "left"].includes(pickerPlacementRef.value)
                    )
                        pickerPlacementRef.value = "top";
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (
                        pickerPlacementRef.value &&
                        !["right", "left"].includes(pickerPlacementRef.value)
                    )
                        pickerPlacementRef.value = "bottom";
                }
            }
        }, 10);
    }

    

    function handleDateSelection(day: IDay) {
        let hoursValue: string = "";
        let minutesValue: string = "";
        let secondsValue: string = "";
        if (props.type === "date") {
            const [hoursVal, minutesVal, secondsVal] = formatDate(
                new Date(),
                "HH:mm:ss",
                false,
            ).split(dateTimeFormatDetails.value.seperator.time);
            hoursValue = hoursVal;
            minutesValue = minutesVal;
            secondsValue = secondsVal;
        } else {
            hoursValue = hourState.value;
            minutesValue = minuteState.value;
            secondsValue = secondState.value;
        }
        if (day.date.includes("UN") || day.date.includes("UNK"))
            modelValue.value = `${day.date} ${hoursValue}:${minutesValue}:${secondsValue}`;
        else if (monthState.value === "Unknown") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [yearVal, monthVal, dateVal] = String(day.date).split("-");
            modelValue.value = `${yearVal}-${dateTimeFormatDetails.value.month.formatted === "MMM" ? "UNK" : "UN"}-${dateVal} ${hoursValue}:${minutesValue}:${secondsValue}`;
        } else
            modelValue.value = new Date(
                `${day.date} ${hoursValue}:${minutesValue}:${secondsValue}`,
            );
        // modelValue.value =
        //     day.date.includes("UN") || day.date.includes("UNK") || monthState.value === "Unknown"
        //         ? `${day.date} ${hoursValue}:${minutesValue}:${secondsValue}`
        //         : new Date(`${day.date} ${hoursValue}:${minutesValue}:${secondsValue}`);
    }

    function handleTimeSelection(time: string, type: TTimeType) {
        let dateValue: TNullableDate = null;
        const hoursValue =
            getStringLength(dateTimeFormatDetails.value.hour.original) === 0
                ? "00"
                : type === "hour"
                  ? time
                  : hourState.value;
        const minutesValue =
            getStringLength(dateTimeFormatDetails.value.minute.original) === 0
                ? "00"
                : type === "minute"
                  ? time
                  : minuteState.value;
        const secondsValue =
            getStringLength(dateTimeFormatDetails.value.second.original) === 0
                ? "00"
                : type === "second"
                  ? time
                  : secondState.value;
        if (props.type === "time") {
            dateValue = new Date();
        } else {
            dateValue = modelValue.value;
        }
        if (typeof dateValue === "string") {
            const [dateFormatRef = ""] = dateValue.split(" ");
            const [firstFormat = "", secondFormat = "", thirdFormat = ""] = String(
                dateFormatRef,
            ).split(dateTimeFormatDetails.value.seperator.date || "-");
            const dateValueRef = getStringLength(firstFormat) === 4 ? thirdFormat : firstFormat;
            const monthValueRef = secondFormat;
            const yearValueRef = getStringLength(firstFormat) === 4 ? firstFormat : thirdFormat;
            modelValue.value = `${yearValueRef}-${monthValueRef}-${dateValueRef} ${hoursValue}:${minutesValue}:${secondsValue}`;
        } else
            modelValue.value = new Date(
                formatDate(
                    `${formatDate(dateValue, "YYYY-MM-DD", false)} ${hoursValue}:${minutesValue}:${secondsValue}`,
                    "YYYY-MM-DD HH:mm:ss",
                    false,
                ),
            );
    }

    function reFocusOnClick() {
        if (inputRef.value && typeof inputRef.value.focus !== "undefined") {
            focusAfterSelecting.value = true;
            inputRef.value.focus();
        }
    }
    function handleCancel() {
        modelValue.value = originalValue.value;
        togglePicker(false);
        reFocusOnClick();
    }

    function handleSubmit() {
        originalValue.value = modelValue.value;
        togglePicker(false);
        emit("on-model-change");
        reFocusOnClick();
    }

    function handleClear() {
        modelValue.value = null;
        originalValue.value = null;
        emit("on-clear");
        emit("on-model-change");
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Tab") {
            isTabNavigating.value = true; // Set flag when Tab is pressed
        }
    }

    // const setCursorAtEnd = (element: HTMLElement | null) => {
    const setCursorAtEnd = (selector: string) => {
        const element = getDOMElement(selector);
        const range = document.createRange();
        const sel = process.client ? window.getSelection() : null;

        if (element && sel) {
            range.selectNodeContents(element);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    const debouncedSpanEdit = useDebounceFn((type: TTimeType, actualValue: string) => {
        let selector = "";
        let element = null;
        if (type === "hour") {
            selector = "span.hour-control";
            element = getDOMElement(selector);
            if (element) {
                element.innerText = actualValue;
                hourState.value = actualValue;
                // hourControl.blur();
            }
        } else if (type === "minute") {
            selector = "span.minute-control";
            element = getDOMElement(selector);
            if (element) {
                element.innerText = actualValue;
                minuteState.value = actualValue;
                // minuteControl.blur();
            }
        } else if (type === "second") {
            selector = "span.second-control";
            element = getDOMElement(selector);
            if (element) {
                element.innerText = actualValue;
                secondState.value = actualValue;
                // secondControl.blur();
            }
        }
        setCursorAtEnd(selector);
        // setCursorAtEnd(element);
    }, 300);

    function handleTimeManualInput(event: Event, type: TTimeType) {
        let currentValue = "00";
        if (type === "hour") currentValue = hourState.value;
        else if (type === "minute") currentValue = minuteState.value;
        else if (type === "second") currentValue = secondState.value;
        const enteredValue = (event.target as HTMLElement).innerText;
        let actualValue = currentValue;
        if (type === "hour" && Number(enteredValue) >= 0 && Number(enteredValue) <= 23)
            actualValue = padCharactersToString(Number(enteredValue), "start", 2);
        else if (type === "minute" && Number(enteredValue) >= 0 && Number(enteredValue) <= 59)
            actualValue = padCharactersToString(Number(enteredValue), "start", 2);
        else if (type === "second" && Number(enteredValue) >= 0 && Number(enteredValue) <= 59)
            actualValue = padCharactersToString(Number(enteredValue), "start", 2);
        else actualValue = "00";

        // if (type === "hour") {
        //     hourState.value = actualValue;
        // } else if (type === "minute") {
        //     minuteState.value = actualValue;
        // } else if (type === "second") {
        //     secondState.value = actualValue;
        // }

        debouncedSpanEdit(type, actualValue);
        handleTimeSelection(actualValue, type);
    }

    watch(
        () => targetIsVisible.value,
        (newTargetIsVisible) => {
            if (!newTargetIsVisible) {
                if (showPicker.value) modelValue.value = originalValue.value;
                togglePicker(false);
            }
        },
    );

    
    onMounted(() => {
        if (modelValue.value) {
           

            
            let dateValueRef = "";
            let monthValueRef = "";
            let yearValueRef = "";
            let hourValueRef = "";
            let minuteValueRef = "";
            let secondValueRef = "";
            const formatterModelValue =
                typeof modelValue.value === "object"
                    ? addUTCModifierAtTheEnd(
                          convertDateTimeToUTC(modelValue.value, "YYYY-MM-DD HH:mm:ss"),
                      )
                    : modelValue.value;
            if (props.type === "time") {
                
                const [dateValue = "", monthValue = "", yearValue = ""] = String(
                    formatterModelValue,
                ).split(dateTimeFormatDetails.value.seperator.date || "-");
                const [correctYear = "", timeValue = ""] = String(yearValue).split(" ");
                const [hourValue = "00", minuteValue = "00", secondValue = "00"] = String(
                    timeValue,
                ).split(dateTimeFormatDetails.value.seperator.time);
                dateValueRef = getStringLength(dateValue) === 4 ? correctYear : dateValue;
                monthValueRef = monthValue;
                yearValueRef = getStringLength(dateValue) === 4 ? correctYear : dateValue;
                hourValueRef = hourValue;
                minuteValueRef = minuteValue;
                secondValueRef = secondValue;

                const dateRef = `${yearValueRef}-${monthValueRef}-${dateValueRef}`;
                selectedYear.value = formatDate(dateRef, "YYYY");
                selectedMonth.value = Number(formatDate(dateRef, "M"));
                selectedDate.value = formatDate(dateRef, "YYYY-MM-DD");
                hourState.value = hourValueRef;
                minuteState.value = minuteValueRef;
                secondState.value = secondValueRef;
                originalValue.value = modelValue.value;
            } else {
                const [dateValue = "", monthValue = "", yearValue = "", timeValue = ""] = String(
                    formatterModelValue,
                ).split(dateTimeFormatDetails.value.seperator.date);
                if (timeValue) {
                    const [hourValue = "", minuteValue = "", secondValue = ""] = timeValue.split(
                        dateTimeFormatDetails.value.seperator.time,
                    );
                    dateValueRef = getStringLength(dateValue) === 4 ? yearValue : dateValue;
                    monthValueRef = monthValue;
                    yearValueRef = getStringLength(yearValue) === 4 ? yearValue : dateValue;
                    hourValueRef = hourValue;
                    minuteValueRef = minuteValue;
                    secondValueRef = secondValue;
                } else {
                    const [firstValue, subTimeValue = ""] = yearValue.split(" ");
                    const [hourValue = "", minuteValue = "", secondValue = ""] = subTimeValue.split(
                        dateTimeFormatDetails.value.seperator.time,
                    );
                    dateValueRef = getStringLength(dateValue) === 4 ? firstValue : dateValue;
                    monthValueRef = monthValue;
                    yearValueRef = getStringLength(firstValue) === 4 ? firstValue : dateValue;
                    hourValueRef = hourValue;
                    minuteValueRef = minuteValue;
                    secondValueRef = secondValue;
                }
                selectedYear.value = formatDate(yearValueRef, "YYYY");
                originalValue.value = modelValue.value;
                selectedMonth.value = isUnknownPossibleForMonth.value
                    ? 13
                    : Number(formatDate(`${yearValueRef}-${monthValueRef}-01`, "M"));
                // const selectedDateRef = isUnknownDateAndMonthAllowed.value.date ? "UN" : Number(formatDate(`${yearValueRef}-${monthValueRef}-${dateValueRef}`, "D"));
                selectedDate.value = isUnknownPossibleForMonth.value
                    ? `${selectedYear.value}-${dateTimeFormatDetails.value.month.formatted === "MMM" ? "UNK" : "UN"}-UN`
                    : formatDate(`${yearValueRef}-${monthValueRef}-${dateValueRef}`, "YYYY-MM-DD");
                hourState.value = hourValueRef;
                minuteState.value = minuteValueRef;
                secondState.value = secondValueRef;
                // modelValue.value = `${selectedYear.value}-${selectedMonth.value}-${selectedDate.value} ${hourState.value}:${minuteState.value}:${secondState.value}`;
            }
        } else {
            const todayDate = new Date();
            selectedMonth.value = Number(formatDate(todayDate, "M", false));
            selectedYear.value = formatDate(todayDate, "YYYY", false);
            const [hoursValue, minutesValue, secondsValue] = formatDate(
                todayDate,
                "HH:mm:ss",
                false,
            ).split(dateTimeFormatDetails.value.seperator.time);
            hourState.value = hoursValue;
            minuteState.value = minutesValue;
            secondState.value = secondsValue;
        }
        selectedDate.value = new Date();
        monthState.value = monthsList.value[Number(selectedMonth.value) - 1];
        // setDaysList();
    });

    const characterCount = computed(() => getStringLength(modelValue.value));
    
</script>

<template>
    <div :class="containerClasses">
        <edc-form-label
            :input-id="getInputId()"
            :label="label"
            :required="required"
            :label-class="labelClass"
            :disabled="disabled"
            :show-help-text="showHelpText"
            :help-text="helpText"
            :label-container-class="labelContainerClass"
        />
        <div
            ref="calendarPickerContainer"
            class="relative calendar-container rounded-[var(--border-radius-6)]"
            :disabled="isElementDisabled(disabled && !readOnly)"
        >
            <template v-if="!readOnly">
                <input
                    :id="getInputId()"
                    ref="inputRef"
                    :value="getInputValue"
                    type="text"
                    :class="inputClasses"
                    :placeholder="placeholder"
                    :disabled="isElementDisabled(disabled)"
                    :readonly="showPicker"
                    :tabindex="tabindex"
                    @click="togglePicker(true)"
                    @keydown="handleKeydown"
                    @focus="
                        () => {
                            if (!focusAfterSelecting) {
                                togglePicker(true);
                            }
                            if (focusAfterSelecting) focusAfterSelecting = false;
                        }
                    "
                    @blur="
                        () => {
                            if (isTabNavigating) {
                                togglePicker(false);
                                isTabNavigating = false;
                            }
                        }
                    "
                />
                <!-- @input="onInput($event)" -->
                <edc-pressable
                    v-if="modelValue !== null && modelValue !== undefined"
                    container-class="absolute top-[50%] right-[2.5rem] -translate-y-1/2"
                    :disabled="isElementDisabled(disabled)"
                    :stop-propogation="true"
                    :on-click="
                        () => {
                            handleClear();
                        }
                    "
                >
                    <edc-icon
                        icon="close-icon"
                        :class="`!w-[1rem] !h-[1rem] top-[-0.1rem] hover:stroke-[var(--color-black)] ${
                            showPicker
                                ? 'stroke-[var(--color-black)]'
                                : 'stroke-[var(--color-gray-text)]'
                        }`"
                    />
                </edc-pressable>
                <button
                    type="button"
                    class="transition-all absolute top-[50%] right-[0.5rem] -translate-y-1/2"
                    :tabindex="-1"
                    :disabled="isElementDisabled(disabled)"
                    @click="togglePicker(true)"
                >
                    <edc-icon
                        icon="calendar"
                        :class="`w-[1.5rem] h-[1.5rem] top-[0rem] ${showPicker ? 'fill-[var(--color-black)] stroke-[var(--color-black)]' : 'fill-[var(--color-gray-text)] stroke-[var(--color-gray-text)]'}`"
                    />
                </button>
                <teleport v-if="pickerPlacementRef" to="body">
                    <edc-transition-visibility>
                        <div
                            v-if="showPicker"
                            ref="calendarPicker"
                            :class="pickerFloatingClasses"
                            :style="{
                                ...floatingStyles,
                                width: `${processPickerWidth}px !important`,
                            }"
                        >
                            <!-- class="picker-container transition-all box-shadow-mild absolute left-0 w-full bg-[var(--color-white)] z-[1000] rounded-[0.5rem] flex flex-col gap-[2rem] p-[1rem]" -->
                            <div
                                v-if="['date', 'datetime'].includes(type)"
                                class="flex flex-row items-center justify-between"
                            >
                                <div class="flex flex-row items-center month-control gap-[1rem]">
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToPrevMonth();
                                                selectedMonth = monthIndex + 1;
                                            }
                                        "
                                        :disabled="viewMode !== 'date'"
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] rotate-180"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                viewMode = 'month';
                                            }
                                        "
                                        :disabled="viewMode !== 'date'"
                                    >
                                        <span
                                            class="inline-block font-bold w-[6.5rem]"
                                            :class="calendarHeaderLabels"
                                            >{{ monthState }}</span
                                        >
                                    </edc-pressable>
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToNextMonth();
                                                selectedMonth = monthIndex + 1;
                                            }
                                        "
                                        :disabled="viewMode !== 'date'"
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem]"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                </div>
                                <div class="flex flex-row items-center year-control gap-[1rem]">
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                selectedYear = String(Number(selectedYear) - 1);
                                            }
                                        "
                                        :disabled="Number(selectedYear) < 0 || viewMode !== 'date'"
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] rotate-180"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                yearsList = getYearsList(Number(selectedYear));
                                                viewMode = 'year';
                                            }
                                        "
                                        :disabled="viewMode !== 'date'"
                                    >
                                        <span class="font-bold" :class="calendarHeaderLabels">{{
                                            selectedYear
                                        }}</span>
                                    </edc-pressable>
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                selectedYear = String(Number(selectedYear) + 1);
                                            }
                                        "
                                        :disabled="viewMode !== 'date'"
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem]"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                </div>
                            </div>
                            <div
                                v-if="viewMode === 'date' && ['date', 'datetime'].includes(type)"
                                class="grid grid-cols-7 gap-[1rem]"
                            >
                                <span
                                    v-for="week of weeksList"
                                    :key="week"
                                    class="font-bold gray-text"
                                    :class="calendarBodyLabels"
                                    >{{ week }}</span
                                >
                            </div>
                            <div
                                v-if="viewMode === 'date' && ['date', 'datetime'].includes(type)"
                                class="grid grid-cols-7 gap-[1rem]"
                            >
                                <!-- isEqual(day.date, String(modelValue).split(' ')[0], 'string') -->
                                <!-- :container-class="`hover:opacity-100 rounded-full w-[2.5rem] h-[2.5rem] group ${day.isToday ? 'bg-[var(--color-accent)] hover:bg-[var(--color-secondary)]' : day.isCurrentMonth ? 'hover:bg-[var(--color-secondary)]' : 'pointer-events-none'} ${compareDate(day.date, modelValue) || compareUnkownDate(day.date, modelValue) ? 'bg-[var(--color-secondary)] white-text' : ''}`" -->
                                <edc-pressable
                                    v-for="[rowIndex, day] of daysList.entries()"
                                    :key="rowIndex"
                                    :container-class="`hover:opacity-100 rounded-full w-[2.5rem] h-[2.5rem] group ${day.isToday ? 'bg-[var(--color-accent)] hover:bg-[var(--color-secondary)]' : day.isCurrentMonth ? 'hover:bg-[var(--color-secondary)]' : 'pointer-events-none'} ${(!day.date.includes('UN') && !day.date.includes('UNK') && compareDate(day.date, modelValue)) || compareUnkownDate(day.date, modelValue) ? 'bg-[var(--color-secondary)] white-text' : ''}`"
                                    slot-wrapper-class="flex flex-row items-center justify-center"
                                    :disabled="day.disabled"
                                    :on-click="
                                        () => {
                                            // selectedDate = dayjsDate(new Date(day.date));
                                            handleDateSelection(day);
                                        }
                                    "
                                >
                                    <span
                                        v-tooltip="day.date.split('-')[2] === 'UN' && 'Unknown'"
                                        :class="[
                                            'transition-all group-hover:text-white',
                                            day.isToday ? 'white-text font-bold' : '',
                                            !day.isCurrentMonth || day.disabled
                                                ? 'disabled-text'
                                                : '',
                                            calendarBodyLabels,
                                        ]"
                                        >{{
                                            !day.date.includes("UN") && !day.date.includes("UNK")
                                                ? formatDate(day.date, "D", false)
                                                : isUnknownPossibleForMonth
                                                  ? day.date.split("-")[2]
                                                  : "UN"
                                        }}</span
                                    >
                                </edc-pressable>
                            </div>
                            <div
                                v-if="viewMode === 'month' && ['date', 'datetime'].includes(type)"
                                class="grid grid-cols-3 gap-[1rem]"
                            >
                                <edc-pressable
                                    v-for="[rowIndex, month] of monthsList.entries()"
                                    :key="rowIndex"
                                    :container-class="`hover:opacity-100 rounded-[var(--border-radius-4)] font-13 py-[0.5rem] group ${compareAsString(selectedMonth - 1, rowIndex) ? 'bg-[var(--color-secondary)] text-white' : ''} hover:bg-[var(--color-secondary)] hover:text-[var(--color-white)]`"
                                    :on-click="
                                        () => {
                                            goToMonth(rowIndex);
                                            selectedMonth = rowIndex + 1;
                                            viewMode = 'date';
                                        }
                                    "
                                >
                                    <span :class="calendarBodyLabels">{{
                                        month.substring(0, 3)
                                    }}</span></edc-pressable
                                >
                            </div>
                            <div
                                v-if="viewMode === 'year' && ['date', 'datetime'].includes(type)"
                                class="flex flex-row items-center justify-between"
                            >
                                <edc-pressable
                                    container-class="w-[10%]"
                                    :on-click="
                                        () => {
                                            yearsList = getYearsList(
                                                returnNullIfIndexDoesNotExist(0, yearsList) - 20,
                                            );
                                        }
                                    "
                                    :disabled="returnNullIfIndexDoesNotExist(0, yearsList) < 0"
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] rotate-180"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                                <div class="w-[70%] grid grid-cols-3 gap-[1rem]">
                                    <edc-pressable
                                        v-for="[rowIndex, year] of yearsList.entries()"
                                        :key="rowIndex"
                                        :container-class="`hover:opacity-100 rounded-[var(--border-radius-4)] group font-13 py-[0.5rem] ${compareAsString(selectedYear, year) ? 'bg-[var(--color-secondary)] text-white' : ''} hover:bg-[var(--color-secondary)] hover:text-[var(--color-white)]`"
                                        :on-click="
                                            () => {
                                                selectedYear = String(year);
                                                viewMode = 'date';
                                                yearsList = [];
                                            }
                                        "
                                    >
                                        <span :class="calendarBodyLabels">{{
                                            year
                                        }}</span></edc-pressable
                                    >
                                </div>
                                <edc-pressable
                                    container-class="w-[10%]"
                                    :on-click="
                                        () => {
                                            yearsList = getYearsList(
                                                returnNullIfIndexDoesNotExist(0, yearsList) + 20,
                                            );
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem]"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                            </div>
                            <div
                                v-if="viewMode === 'date' && ['datetime', 'time'].includes(type)"
                                class="flex flex-row items-center justify-evenly gap-[1rem]"
                            >
                                <div
                                    v-if="getStringLength(dateTimeFormatDetails.hour.original) > 0"
                                    class="flex flex-col gap-[0.5rem] items-center w-fit"
                                >
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToNextHour();
                                                handleTimeSelection(hourState, 'hour');
                                            }
                                        "
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] -rotate-90"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                    <span
                                        :contenteditable="true"
                                        :class="[
                                            calendarBodyLabels,
                                            'hour-control',
                                            'editable-content',
                                        ]"
                                        @input="handleTimeManualInput($event, 'hour')"
                                        >{{ hourState }}</span
                                    >
                                    <!-- <edc-text-input

                                    /> -->
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToPrevHour();
                                                handleTimeSelection(hourState, 'hour');
                                            }
                                        "
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] rotate-90"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                </div>
                                <span
                                    v-if="timeColonDetails.showColorBetweenHourAndMinute"
                                    class="font-bold"
                                    :class="calendarBodyLabels"
                                    >:</span
                                >
                                <div
                                    v-if="
                                        getStringLength(dateTimeFormatDetails.minute.original) > 0
                                    "
                                    class="flex flex-col gap-[0.5rem] items-center w-fit"
                                >
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToNextMinute();
                                                handleTimeSelection(minuteState, 'minute');
                                            }
                                        "
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] -rotate-90"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                    <span
                                        :contenteditable="true"
                                        :class="[
                                            calendarBodyLabels,
                                            'minute-control',
                                            'editable-content',
                                        ]"
                                        @input="handleTimeManualInput($event, 'minute')"
                                        >{{ minuteState }}</span
                                    >
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToPrevMinute();
                                                handleTimeSelection(minuteState, 'minute');
                                            }
                                        "
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] rotate-90"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                </div>
                                <span
                                    v-if="timeColonDetails.showColorBetweenMinuteAndSecond"
                                    class="font-bold"
                                    :class="calendarBodyLabels"
                                    >:</span
                                >
                                <div
                                    v-if="
                                        getStringLength(dateTimeFormatDetails.second.original) > 0
                                    "
                                    class="flex flex-col gap-[0.5rem] items-center w-fit"
                                >
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToNextSecond();
                                                handleTimeSelection(secondState, 'second');
                                            }
                                        "
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] -rotate-90"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                    <span
                                        :contenteditable="true"
                                        :class="[
                                            calendarBodyLabels,
                                            'second-control',
                                            'editable-content',
                                        ]"
                                        @input="handleTimeManualInput($event, 'second')"
                                        >{{ secondState }}</span
                                    >
                                    <edc-pressable
                                        :on-click="
                                            () => {
                                                goToPrevSecond();
                                                handleTimeSelection(secondState, 'second');
                                            }
                                        "
                                    >
                                        <edc-icon
                                            icon="chevron-right-sharp"
                                            class="transition-all w-[1.1rem] h-[1.1rem] rotate-90"
                                            fill="var(--color-black)"
                                        />
                                    </edc-pressable>
                                </div>
                            </div>
                            <div class="flex flex-row items-center justify-between gap-[1rem]">
                                <EdcActionButton
                                    label="Cancel"
                                    type="cancel"
                                    :on-click="() => handleCancel()"
                                    container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                    label-class="font-12"
                                    :disabled="['month', 'year'].includes(viewMode)"
                                />
                                <EdcActionButton
                                    label="Apply"
                                    :on-click="() => handleSubmit()"
                                    container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                    label-class="font-12"
                                    :disabled="!modelValue || ['month', 'year'].includes(viewMode)"
                                />
                            </div>
                        </div>
                    </edc-transition-visibility>
                </teleport>
                <edc-transition-visibility v-else>
                    <div
                        v-if="showPicker"
                        ref="calendarPicker"
                        class="picker-container transition-all box-shadow-mild absolute left-0 w-full bg-[var(--color-white)] z-[1000] rounded-[0.5rem] flex flex-col gap-[2rem] p-[1rem]"
                    >
                        <!-- class="picker-container transition-all box-shadow-mild absolute left-0 w-full bg-[var(--color-white)] z-[1000] rounded-[0.5rem] flex flex-col gap-[2rem] p-[1rem]" -->
                        <div
                            v-if="['date', 'datetime'].includes(type)"
                            class="flex flex-row items-center justify-between"
                        >
                            <div class="flex flex-row items-center month-control gap-[1rem]">
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToPrevMonth();
                                            selectedMonth = monthIndex + 1;
                                        }
                                    "
                                    :disabled="viewMode !== 'date'"
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] rotate-180"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            viewMode = 'month';
                                        }
                                    "
                                    :disabled="viewMode !== 'date'"
                                >
                                    <span
                                        class="inline-block font-bold w-[6.5rem]"
                                        :class="calendarHeaderLabels"
                                        >{{ monthState }}</span
                                    >
                                </edc-pressable>
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToNextMonth();
                                            selectedMonth = monthIndex + 1;
                                        }
                                    "
                                    :disabled="viewMode !== 'date'"
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem]"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                            </div>
                            <div class="flex flex-row items-center year-control gap-[1rem]">
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            selectedYear = String(Number(selectedYear) - 1);
                                        }
                                    "
                                    :disabled="Number(selectedYear) < 0 || viewMode !== 'date'"
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] rotate-180"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            yearsList = getYearsList(Number(selectedYear));
                                            viewMode = 'year';
                                        }
                                    "
                                    :disabled="viewMode !== 'date'"
                                >
                                    <span class="font-bold" :class="calendarHeaderLabels">{{
                                        selectedYear
                                    }}</span>
                                </edc-pressable>
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            selectedYear = String(Number(selectedYear) + 1);
                                        }
                                    "
                                    :disabled="viewMode !== 'date'"
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem]"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                            </div>
                        </div>
                        <div
                            v-if="viewMode === 'date' && ['date', 'datetime'].includes(type)"
                            class="grid grid-cols-7 gap-[1rem]"
                        >
                            <span
                                v-for="week of weeksList"
                                :key="week"
                                class="font-bold font-13 gray-text"
                                >{{ week }}</span
                            >
                        </div>
                        <div
                            v-if="viewMode === 'date' && ['date', 'datetime'].includes(type)"
                            class="grid grid-cols-7 gap-[1rem]"
                        >
                            <edc-pressable
                                v-for="[rowIndex, day] of daysList.entries()"
                                :key="rowIndex"
                                :container-class="`hover:opacity-100 rounded-full w-[2.5rem] h-[2.5rem] group ${day.isToday ? 'bg-[var(--color-accent)] hover:bg-[var(--color-secondary)]' : day.isCurrentMonth ? 'hover:bg-[var(--color-secondary)]' : 'pointer-events-none'} ${compareDate(day.date, modelValue) ? 'bg-[var(--color-secondary)] white-text' : ''}`"
                                slot-wrapper-class="flex flex-row items-center justify-center"
                                :on-click="
                                    () => {
                                        // selectedDate = dayjsDate(new Date(day.date));
                                        handleDateSelection(day);
                                    }
                                "
                            >
                                <span
                                    :class="[
                                        'font-13 transition-all group-hover:text-white',
                                        day.isToday ? 'white-text font-bold' : '',
                                        day.isCurrentMonth ? '' : 'disabled-text',
                                    ]"
                                    >{{ formatDate(day.date, "D", false) }}</span
                                >
                            </edc-pressable>
                        </div>
                        <div
                            v-if="viewMode === 'month' && ['date', 'datetime'].includes(type)"
                            class="grid grid-cols-3 gap-[1rem]"
                        >
                            <edc-pressable
                                v-for="[rowIndex, month] of monthsList.entries()"
                                :key="rowIndex"
                                :container-class="`hover:opacity-100 rounded-[var(--border-radius-4)] font-13 py-[0.5rem] group ${compareAsString(selectedMonth - 1, rowIndex) ? 'bg-[var(--color-secondary)] text-white' : ''} hover:bg-[var(--color-secondary)] hover:text-[var(--color-white)]`"
                                :on-click="
                                    () => {
                                        goToMonth(rowIndex);
                                        selectedMonth = rowIndex + 1;
                                        viewMode = 'date';
                                    }
                                "
                            >
                                <span :class="calendarBodyLabels">{{
                                    month.substring(0, 3)
                                }}</span></edc-pressable
                            >
                        </div>
                        <div
                            v-if="viewMode === 'year' && ['date', 'datetime'].includes(type)"
                            class="flex flex-row items-center justify-between"
                        >
                            <edc-pressable
                                container-class="w-[10%]"
                                :on-click="
                                    () => {
                                        yearsList = getYearsList(
                                            returnNullIfIndexDoesNotExist(0, yearsList) - 20,
                                        );
                                    }
                                "
                                :disabled="returnNullIfIndexDoesNotExist(0, yearsList) < 0"
                            >
                                <edc-icon
                                    icon="chevron-right-sharp"
                                    class="transition-all w-[1.1rem] h-[1.1rem] rotate-180"
                                    fill="var(--color-black)"
                                />
                            </edc-pressable>
                            <div class="w-[70%] grid grid-cols-3 gap-[1rem]">
                                <edc-pressable
                                    v-for="[rowIndex, year] of yearsList.entries()"
                                    :key="rowIndex"
                                    :container-class="`hover:opacity-100 rounded-[var(--border-radius-4)] group font-13 py-[0.5rem] ${compareAsString(selectedYear, year) ? 'bg-[var(--color-secondary)] text-white' : ''} hover:bg-[var(--color-secondary)] hover:text-[var(--color-white)]`"
                                    :on-click="
                                        () => {
                                            selectedYear = String(year);
                                            viewMode = 'date';
                                            yearsList = [];
                                        }
                                    "
                                >
                                    <span :class="calendarBodyLabels">{{
                                        year
                                    }}</span></edc-pressable
                                >
                            </div>
                            <edc-pressable
                                container-class="w-[10%]"
                                :on-click="
                                    () => {
                                        yearsList = getYearsList(
                                            returnNullIfIndexDoesNotExist(0, yearsList) + 20,
                                        );
                                    }
                                "
                            >
                                <edc-icon
                                    icon="chevron-right-sharp"
                                    class="transition-all w-[1.1rem] h-[1.1rem]"
                                    fill="var(--color-black)"
                                />
                            </edc-pressable>
                        </div>
                        <div
                            v-if="viewMode === 'date' && ['datetime', 'time'].includes(type)"
                            class="flex flex-row items-center justify-evenly gap-[1rem]"
                        >
                            <div class="flex flex-col gap-[0.5rem] items-center w-fit">
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToNextHour();
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] -rotate-90"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                                <span :class="calendarBodyLabels">{{ hourState }}</span>
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToPrevHour();
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] rotate-90"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                            </div>
                            <span class="font-bold" :class="calendarBodyLabels">:</span>
                            <div class="flex flex-col gap-[0.5rem] items-center w-fit">
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToNextMinute();
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] -rotate-90"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                                <span :class="calendarBodyLabels">{{ minuteState }}</span>
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToPrevMinute();
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] rotate-90"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                            </div>
                            <span class="font-bold" :class="calendarBodyLabels">:</span>
                            <div class="flex flex-col gap-[0.5rem] items-center w-fit">
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToNextSecond();
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] -rotate-90"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                                <span :class="calendarBodyLabels">{{ secondState }}</span>
                                <edc-pressable
                                    :on-click="
                                        () => {
                                            goToPrevSecond();
                                        }
                                    "
                                >
                                    <edc-icon
                                        icon="chevron-right-sharp"
                                        class="transition-all w-[1.1rem] h-[1.1rem] rotate-90"
                                        fill="var(--color-black)"
                                    />
                                </edc-pressable>
                            </div>
                        </div>
                        <div class="flex flex-row items-center justify-between gap-[1rem]">
                            <EdcActionButton
                                label="Cancel"
                                type="cancel"
                                :on-click="() => handleCancel()"
                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                label-class="font-12"
                            />
                            <EdcActionButton
                                label="Apply"
                                :on-click="() => handleSubmit()"
                                container-class="rounded-[--border-radius-4] px-[2rem] py-[0.5rem]"
                                label-class="font-12"
                            />
                        </div>
                    </div>
                </edc-transition-visibility>
            </template>
            <input
                v-else
                :id="getInputId()"
                :value="getInputValue"
                type="text"
                :class="inputClasses"
                :readonly="readOnly"
                @click="togglePicker(true)"
                @focus="togglePicker(true)"
                @blur="togglePicker(false)"
            />
            <span v-if="showCharacterCount" class="text-[1.1rem]">{{ characterCount }} / {{ maxLength }}</span>
        </div>
       
        <edc-error-text :error="error" container-class="mt-[0.3rem]" />
    </div>
</template>

<style scoped>
    .slide-carousal-enter-from,
    .slide-carousal-leave-to {
        transform: translateX(100%);
        opacity: 0;
    }

    .slide-carousal-enter-active,
    .slide-carousal-leave-active {
        transition: 2s cubic-bezier(0.075, 0.82, 0.165, 1) all;
    }
    .container {
        display: flex;
        flex-direction: column;
        gap: 0rem;
    }

    .text-label {
        width: 100%;
    }

    div.picker-container {
        border: 0.1rem solid var(--color-grey);
    }

    div.picker-container p:first-child {
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
    }
    div.picker-container p:last-child {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
    }

    .date-selection-container {
        transition: all 0.2s ease-in-out;
        border-radius: var(--border-radius-6);
        padding: 0.2rem 0.5rem;
        outline: none;
        width: 100%;
        border: 0.1rem solid var(--color-border);
    }

    .date-selection-container::placeholder {
        font-size: var(--text-11);
        font-weight: 400;
        line-height: 2rem;
        margin: 0 0 0.5rem 0;
        color: var(--color-placeholder);
    }

    .date-selection-container:focus {
        border: 0.1rem solid var(--color-secondary) !important;
    }

    .editable-content {
        border: 0.1rem solid var(--color-border);
        border-radius: var(--border-radius-6);
        padding: 0.4rem 0.4rem;
        outline: none;
        transition: all 0.2s ease-in-out;
    }
    .editable-content:focus {
        border: 0.1rem solid var(--color-secondary) !important;
    }
</style>
