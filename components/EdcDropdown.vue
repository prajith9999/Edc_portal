<script setup lang="ts">
    // @ts-nocheck
    import useGlobalStore from "~/stores/global";
    import type { TNullableNumber, TNullableString, TOptionValue } from "~/types/common";
    import type {
        IDropdownOptions,
        IDropdownProps,
        TFloatingDropdownPlacement,
        TTabIndex,
    } from "~/types/form-generation";
    import { useFloating, offset, autoUpdate, flip, shift } from "@floating-ui/vue";
    import { getTabIndexByControlType, getTabIndexByIndex } from "~/utils/form-generation";

    const modelValue = defineModel<TNullableString | TNullableNumber>({
        default: null,
    });
    const specifyModel = defineModel<TNullableString>("specify");

    const props = withDefaults(defineProps<IDropdownProps>(), {
        label: "",
        elementId: "",
        containerClass: "",
        inputContainerClass: "",
        labelContainerClass: "",
        inputClass: "",
        labelClass: "",
        defaultValue: "Choose an option",
        optionPosition: "auto",
        disabled: false,
        error: "",
        optionPlacement: undefined,
        optionOffset: 0,
        optionClass: "",
        type: "default",
        labelAction: () => {},
        resetOption: false,
        required: false,
        loading: false,
        readOnly: false,
        enableClear: false,
        ellipseCount: 20,
        showHelpText: false,
        helpText: null,
        tabindex: undefined,
        tabindexes: undefined,
    });

    const emit = defineEmits<{
        "on-input": [event: Event];
        "on-select": [selectedOptions: Array<TOptionValue>];
        "on-clear": [];
        "on-model-change": [];
    }>();

    const { width } = useWindowSize();
    const globalStore = useGlobalStore();
    const search = ref<string>("");
    const selectedOptions = ref<Array<TOptionValue>>([]);
    const optionsList = ref<IDropdownOptions[]>([...props.options]);
    const showOptions = ref<boolean>(false);
    const optionsContainer = ref(null);
    const optionPicker = ref(null);
    const inputRef = ref(null);
    const optionPlacementRef = ref<TFloatingDropdownPlacement | undefined>(props.optionPlacement);
    const isTabNavigating = ref<boolean>(false);
    const focusAfterSelecting = ref<boolean>(false);
    const tabIndexes = ref<TTabIndex>(getTabIndexByControlType(props.tabindexes));

    const { floatingStyles } = useFloating(optionsContainer, optionPicker, {
        transform: false,
        middleware: [offset(props.optionOffset), flip(), shift()],
        placement: optionPlacementRef, // props.optionPlacement,
        whileElementsMounted: autoUpdate,
    });

    const targetIsVisible = useElementVisibility(optionsContainer);

    // watchEffect(() => {
    //     update();
    // });

    const getInputId = useMemoize(
        () => props.elementId || convertWordsIntoCasedWords(props.label, "camel case"),
    );

    const showSpecifyEntry = computed(
        () =>
            getArrayLength(
                optionsList.value.filter(
                    ({ value, specify = false }) =>
                        // (value === modelValue.value) !== null && specify,
                        value === modelValue.value && specify,
                ),
            ) > 0,
    );

    const containerClasses = computed(() => `container ${props.containerClass}`.trim());
    // const labelClasses = computed(() => ({
    //     "input-label text-label": true,
    //     [props.labelClass]: props.labelClass,
    //     "input-font": !props.labelClass.includes("font"),
    // }));

    const inputContainerClasses = computed(() => ({
        "flex flex-col rounded-[var(--border-radius-6)]": true,
        [props.inputContainerClass]: props.inputContainerClass,
    }));

    const optionFloatingClasses = computed(() => ({
        // "picker-container transition-all box-shadow-mild absolute left-0 bg-[var(--color-white)] z-[1000] rounded-[0.5rem] flex flex-col gap-[2rem] p-[1rem]":
        "options-container transition-all box-shadow-mild absolute left-0 bg-[var(--color-white)] z-[1000] rounded-[0.5rem]":
            true,
        [props.optionClass]: props.optionClass,
        "!w-[23.45rem]": props.optionClass && showSpecifyEntry.value,
        // "w-full": !props.optionClass,
        // "w-[30rem]": !props.pickerClass,
    }));
    const inputClasses = computed(() => ({
        "input-value form-input": true,
        [props.inputClass]: props.inputClass,
        "input-font": !props.inputClass.includes("font"),
        "readonly-form-input pointer-events-none resize-none": props.readOnly,
    }));
    // border-[0.05rem] border-b-[var(--color-border)]
    const optionLabelClasses = computed(() => ({
        "transition-all cursor-pointer px-[1rem] py-[0.5rem] text-left": true,
        "input-font":
            !props.labelClass.includes("admin-input-font") ||
            !props.inputClass.includes("admin-input-font"),
        "admin-input-font":
            props.labelClass.includes("admin-input-font") ||
            props.inputClass.includes("admin-input-font"),
    }));

    const tooltip = computed(() => {
        let result = "";
        if (modelValue.value !== null) {
            const labelResult = getDropdownLabelByValue(optionsList.value, modelValue.value);
            if (labelResult) result = labelResult;
        }
        return result;
    });

    const processDropdownWidth = computed(() => {
        let processedWidth = 0;
        if (optionsContainer.value) {
            processedWidth = optionsContainer.value.getBoundingClientRect().width;
        }
        return processedWidth;
    });

    const toggleOptions = (defaultValue: boolean | string = "") =>
        typeof defaultValue === "boolean"
            ? (showOptions.value = defaultValue)
            : (showOptions.value = !showOptions.value);

    onClickOutside(
        optionsContainer,
        () => {
            toggleOptions(false);
            search.value = "";
            // const inputElement = getDOMElement(`#${getInputId()}`);
            // console.log("document.activeElement", document.activeElement);
            // console.log("inputElement", inputElement);
            // console.log("document.activeElement", document.activeElement);
        },
        {
            ignore: [optionPicker],
        },
    );

    function resetOption() {
        modelValue.value = null;
        selectedOptions.value = [];
    }

    // function setSelectedOption(selectedOption: string) {
    function setSelectedOption(selectedOption: TOptionValue) {
        selectedOptions.value = [selectedOption];
        toggleOptions(false);
        search.value = "";
        // props.model[props.modelKey] = selectedOption;
        modelValue.value = selectedOption;
        if (inputRef.value && typeof inputRef.value.focus !== "undefined") {
            focusAfterSelecting.value = true;
            inputRef.value.focus();
        }
        // props.model = selectedOption;
        emit("on-select", selectedOptions.value);
        emit("on-model-change");
        if (props.resetOption) resetOption();
    }
    // bottom-[100%] translate-y-[122%]

    // function setMultiSelectedOption(selectedOption: TOptionValue) {
    //     console.log("selectedOption", selectedOption);
    //     const itemParam = {
    //         data: selectedOptions.value,
    //         type: "primitive",
    //         value: selectedOption,
    //     } as IItemCheck;
    //     const isItemExist = checkIfItemExists(itemParam);
    //     console.log("isItemExist", isItemExist);
    //     if (isItemExist) {
    //         const indexOfTheItem = getIndexOfTheItem(itemParam);
    //         selectedOptions.value.splice(indexOfTheItem, 1);
    //     } else {
    //         selectedOptions.value.push(selectedOption);
    //     }
    //     emit("on-select", selectedOptions.value);
    //     if (props.resetOption) resetOption();
    // }

    // const calculateElementBounding = () => {
    //     // const dropdownOptions = document.querySelector("div.options-container");
    //     const dropdownContainer = document.querySelector("div.group");
    //     // const dropdownHeight = dropdownOptions!.clientHeight;
    //     const windowHeight = window.innerHeight;
    //     const dropdownTop = dropdownContainer!.getBoundingClientRect().top;

    //     // console.log("dropdownHeight", dropdownHeight);
    //     console.log("windowHeight", windowHeight);
    //     console.log("dropdownTop", dropdownTop);

    //     // if (windowHeight - dropdownTop < dropdownHeight) {
    //     //     dropdownOptions!.style.bottom = "100%";
    //     //     dropdownOptions!.style.top = "auto";
    //     // } else {
    //     //     dropdownOptions!.style.bottom = "auto";
    //     //     dropdownOptions!.style.top = "100%";
    //     // }
    // };
    function calculateElementBounding() {
        setTimeout(() => {
            const dropdownOptions = getDOMElement("div.options-container");
            const dropdownHeight = dropdownOptions.clientHeight;
            const windowHeight = window.innerHeight;
            const dropdownContainer = getDOMElement("div.dropdown-container");
            const dropdownTop = dropdownContainer
                ? dropdownContainer.getBoundingClientRect().top
                : 0;
            // if (windowHeight - dropdownTop < dropdownHeight || props.optionPosition === "top") {
            //     // show in top
            //     dropdownOptions.style.bottom = "100%";
            //     dropdownOptions.style.top = "auto";
            // } else {
            //     dropdownOptions.style.bottom = "auto";
            //     dropdownOptions.style.top = "100%";
            // }
            if (props.optionPosition === "top") {
                // show in top
                dropdownOptions.style.bottom = "100%";
                dropdownOptions.style.top = "auto";
            } else if (props.optionPosition === "bottom") {
                dropdownOptions.style.bottom = "auto";
                dropdownOptions.style.top = "100%";
            } else if (windowHeight - dropdownTop < dropdownHeight) {
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
            if (optionPicker.value && optionsContainer.value) {
                const dropdownOptions = optionPicker.value as HTMLElement;
                const dropdownHeight = dropdownOptions.clientHeight;
                const windowHeight = window.innerHeight;
                const dropdownTop = (optionsContainer.value as HTMLElement).getBoundingClientRect()
                    .top;
                // if (props.optionPosition === "top") {
                //     // show in top
                //     dropdownOptions.style.bottom = "100%";
                //     dropdownOptions.style.top = "auto";
                // } else if (props.optionPosition === "bottom") {
                //     dropdownOptions.style.bottom = "auto";
                //     dropdownOptions.style.top = "100%";
                // } else
                if (windowHeight - dropdownTop < dropdownHeight) {
                    // show in top
                    if (
                        optionPlacementRef.value &&
                        !["right", "left"].includes(optionPlacementRef.value)
                    )
                        optionPlacementRef.value = "top";
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (
                        optionPlacementRef.value &&
                        !["right", "left"].includes(optionPlacementRef.value)
                    )
                        optionPlacementRef.value = "bottom";
                }
            }
        }, 10);
    }

    function onInput(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value;
        search.value = inputValue;
        emit("on-input", event);
    }

    // inputRef
    // function checkIfInputTextOverflow() {
    //     let result = false;
    //     let overflowIndexRef = -1;
    //     if (inputRef.value) {
    //         const inputWidth = (inputRef.value as HTMLElement).offsetWidth; // The visible width of the input field
    //         const textWidth = (inputRef.value as HTMLElement).scrollWidth; // The width of the text inside the input
    //         console.log("inputWidth", inputWidth);
    //         console.log("textWidth", textWidth);
    //         const thresholdWidth = inputWidth * 0.7;
    //         console.log("thresholdWidth", textWidth);
    //         const overflowIndex = findOverflowIndex(
    //             selectedOptionsLabel.join(", "),
    //             thresholdWidth,
    //             inputRef.value,
    //         );
    //         if (overflowIndex !== -1) {
    //             // Truncate the text with ellipsis at the overflow index
    //             this.displayedText = this.inputText.slice(0, overflowIndex) + "...";
    //             result = true;
    //             overflowIndexRef = overflowIndex;
    //         }
    //         // if (textWidth > thresholdWidth) {
    //         //     result = true;
    //         // }
    //         // else {
    //         //     // Otherwise, just show the full text
    //         //     this.displayedText = this.inputText;
    //         // }
    //     }
    //     return result;
    // }

    function calculateTextWidth(text: string) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font =
            width.value < 1024
                ? "1.1rem Avenir LT Std Book"
                : // : getAppType() === "admin"
                  //   ? "1.2rem Avenir LT Std Book"
                  "1.4rem Avenir LT Std Book"; // Use the same font as the input field
        return context.measureText(text).width;
    }

    function updateText(concatString: string) {
        let textIndex = -1;
        if (inputRef.value) {
            // Calculate the available width of the input field
            // FIXME: need to adjust the factor
            const availableWidth = inputRef.value
                ? (inputRef.value as HTMLInputElement).clientWidth * 0.8
                : 0;

            // Temporarily apply the full text to measure its width
            const textWidth = calculateTextWidth(concatString);

            // Check if the text needs truncation
            if (textWidth > availableWidth) {
                // Apply truncation if text doesn't fit
                // ellipseCount.value = Math.floor(concatString.length * (availableWidth / textWidth));
                // displayText.value = selectedOption.value.slice(0, ellipseCount.value) + '...';
                textIndex = Math.floor(concatString.length * (availableWidth / textWidth));
            }
            //   else {
            //     // No truncation needed
            //     displayText.value = selectedOption.value;
            //   }
        }
        return textIndex;
    }

    const getInputValue = computed(() => {
        if (modelValue.value !== null) {
            const selectedOptionsLabel: string[] = [];
            for (const row of selectedOptions.value) {
                const isRowExists = optionsList.value.filter((optionRow) =>
                    isEqual(optionRow.value, row, "string"),
                );
                if (getArrayLength(isRowExists) > 0)
                    selectedOptionsLabel.push(isRowExists[0].label);
            }
            // return selectedOptions.value.join(", ");
            const selectedOptionLabels = selectedOptionsLabel.join(", ");
            const ellipseCountRef = updateText(selectedOptionLabels);
            // if (
            //     getStringLength(selectedOptionLabels) === 0 ||
            //     (getStringLength(selectedOptionLabels) > 0 &&
            //         getStringLength(selectedOptionLabels) <= props.ellipseCount - 1)
            // )
            //     return selectedOptionLabels;
            // return `${selectedOptionLabels.substring(0, props.ellipseCount).trim()}...`;
            if (
                getStringLength(selectedOptionLabels) === 0 ||
                ellipseCountRef === -1 ||
                (getStringLength(selectedOptionLabels) > 0 &&
                    getStringLength(selectedOptionLabels) <= ellipseCountRef - 1)
            )
                return selectedOptionLabels;
            return `${selectedOptionLabels.substring(0, ellipseCountRef).trim()}...`;
            // if (checkIfInputTextOverflow()) return `${selectedOptionLabels.substring(0, props.ellipseCount).trim()}...`;
            // return `${selectedOptionsLabel.join(", ").substring(0, 10)}...`;
        }
        return "";
    });
    const getDefaultValue = computed(() => props.defaultValue);
    const isOptionSelected = (value: TOptionValue) => selectedOptions.value.includes(value);
    // const getOptions = computed(() => selectedOptions.value.join(", "));

    function handleClear() {
        resetOption();
        emit("on-clear");
        emit("on-model-change");
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Tab") {
            isTabNavigating.value = true; // Set flag when Tab is pressed
        }
    }

    const activeOptionIndex = ref<number>(0);
    function handleSelectedOptionByKeyboard() {
        let result = null;
        for (let i = 0; i < getArrayLength(optionsList.value); i++) {
            if (i === activeOptionIndex.value) {
                result = optionsList.value[i].value;
                break;
            }
        }
        if (result) setSelectedOption(result);
    }
    function handleKeydownForOptionNavigation(event: KeyboardEvent) {
        if (!showOptions.value && event.key === "Enter") {
            showOptions.value = true;
            return;
        }
        if (!showOptions.value) return;
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                activeOptionIndex.value = (activeOptionIndex.value + 1) % props.options.length;
                scrollIntoActiveOption();
                break;

            case "ArrowUp":
                event.preventDefault();
                activeOptionIndex.value =
                    activeOptionIndex.value <= 0
                        ? props.options.length - 1
                        : activeOptionIndex.value - 1;
                scrollIntoActiveOption();
                break;

            case "Enter":
                event.preventDefault();
                handleSelectedOptionByKeyboard();
                break;

            case "Escape":
                event.preventDefault();
                showOptions.value = false;
                break;
        }
    }
    function scrollIntoActiveOption() {
        const optionsContainerList = getDOMElements("div.options-container p");
        if (getArrayLength(optionsContainerList) > 0) {
            if (checkIfIndexExistInArray(activeOptionIndex.value, optionsContainerList)) {
                optionsContainerList[activeOptionIndex.value].scrollIntoView({
                    behavior: "smooth",
                    block: "nearest", // or 'center' based on your preference
                });
            }
        }
    }

    watch(search, () => {
        optionsList.value = props.options.filter(
            // (row) => row.label.toLowerCase().indexOf(search.value.toLowerCase()) > -1,
            (row) => row.label.toLowerCase().includes(search.value.toLowerCase()),
        );
    });
    watch(showOptions, (newShowOptions) => {
        globalStore.dropdownOptionVisible = newShowOptions;
        if (newShowOptions && !props.optionPlacement) {
            calculateElementBounding();
        } else if (newShowOptions && props.optionPlacement) {
            calculateFloatingElementBounding();
        }
    });
    watch(
        () => props.options,
        (newOptions) => {
            optionsList.value = [...newOptions];
        },
        {
            deep: true,
        },
    );
    watch(
        () => targetIsVisible.value,
        (newTargetIsVisible) => {
            if (!newTargetIsVisible) {
                toggleOptions(false);
                search.value = "";
            }
        },
    );

    onMounted(() => {
        // resetOption();
        // selectedOptions.value = [getDefaultInputValue(props.value)];
        // selectedOptions.value = [getDefaultInputValue(props.model[props.modelKey])];
        selectedOptions.value = [];
        if (Array.isArray(modelValue.value)) {
            for (const row of modelValue.value) {
                selectedOptions.value.push(getDefaultInputValue(row) as TOptionValue);
            }
        } else {
            selectedOptions.value = [
                getDefaultInputValue(modelValue.value as TNullableString),
            ] as TOptionValue[];
        }
    });

    // function getWidth() {
    //     if (optionsContainer.value) {
    //         const width = optionsContainer.value.getBoundingClientRect().width;
    //         if (dropdownWidth.value !== width) dropdownWidth.value = width;
    //         console.log("Target element width:", width);
    //     }
    // }
</script>

<template>
    <div :class="containerClasses">
        <!-- <label v-if="label && type === 'default'" :for="getInputId()" :class="labelClasses">
            {{ label }}
        </label> -->
        <edc-form-label
            v-if="type === 'default'"
            :input-id="getInputId()"
            :label="label"
            :required="required"
            :label-class="labelClass"
            :display-condition="type === 'default'"
            :disabled="disabled"
            :show-help-text="showHelpText"
            :help-text="helpText"
            :label-container-class="labelContainerClass"
        />
        <div :class="inputContainerClasses" :disabled="isElementDisabled(disabled)">
            <div class="flex flex-row items-center gap-[0.5rem]">
                <div
                    ref="optionsContainer"
                    v-tooltip="{
                        content: getInputValue.includes('...') && !!tooltip && String(tooltip),
                        placement: 'top',
                    }"
                    :class="[
                        'relative dropdown-container',
                        showSpecifyEntry ? 'w-[70%]' : 'w-[100%]',
                    ]"
                    @click="toggleOptions(true && !disabled)"
                    @keydown="handleKeydownForOptionNavigation"
                >
                    <template v-if="!readOnly">
                        <input
                            v-if="type === 'default'"
                            :id="getInputId()"
                            ref="inputRef"
                            :value="getInputValue"
                            :placeholder="getDefaultValue"
                            type="text"
                            :class="inputClasses"
                            :disabled="isElementDisabled(disabled, loading)"
                            :tabindex="getTabIndexByIndex(tabIndexes, 0)"
                            @input="onInput($event)"
                            @keydown="handleKeydown"
                            @focus="
                                () => {
                                    if (!focusAfterSelecting) {
                                        toggleOptions(true && !disabled);
                                    }
                                    if (focusAfterSelecting) focusAfterSelecting = false;
                                }
                            "
                            @blur="
                                () => {
                                    if (isTabNavigating) {
                                        toggleOptions(false);
                                        isTabNavigating = false;
                                    }
                                }
                            "
                        />
                        <div
                            v-if="loading"
                            class="transition-all absolute right-[0.8rem] top-[50%] -translate-y-1/2"
                        >
                            <edc-spinner loader-class="w-[1.5rem] p-[0.2rem]" />
                        </div>
                        <edc-pressable
                            v-if="
                                type === 'default' &&
                                !loading &&
                                modelValue !== null &&
                                modelValue !== undefined &&
                                enableClear
                            "
                            container-class="absolute top-[50%] right-[2.3rem] -translate-y-1/2"
                            :disabled="isElementDisabled(disabled, loading)"
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
                                    showOptions
                                        ? 'stroke-[var(--color-black)]'
                                        : 'stroke-[var(--color-gray-text)]'
                                }`"
                            />
                        </edc-pressable>
                        <button
                            v-if="type === 'default' && !loading"
                            type="button"
                            :tabindex="-1"
                            class="transition-all absolute top-[50%] right-[0.5rem] -translate-y-1/2"
                            :disabled="isElementDisabled(disabled, loading)"
                        >
                            <edc-icon
                                icon="chevron-down-curve"
                                :class="`w-[1.5rem] h-[1.5rem] top-[0.3rem] ${showOptions ? 'fill-[var(--color-black)] stroke-[var(--color-black)]' : 'fill-[var(--color-gray-text)] stroke-[var(--color-gray-text)]'}`"
                            />
                        </button>
                        <admin-action-label
                            v-else-if="type === 'label'"
                            icon="circle-plus"
                            :text="label"
                            :disabled="disabled"
                            :on-click="() => labelAction()"
                        />
                        <teleport v-if="optionPlacementRef" to="body">
                            <edc-transition-visibility>
                                <div
                                    v-if="showOptions"
                                    ref="optionPicker"
                                    :class="optionFloatingClasses"
                                    :style="{
                                        ...floatingStyles,
                                        width: `${processDropdownWidth}px !important`,
                                    }"
                                >
                                    <!-- border-[0.05rem] border-b-[var(--color-border)] -->
                                    <p
                                        v-for="(option, index) of optionsList"
                                        :key="`${option.label}-${index}`"
                                        :class="[
                                            optionLabelClasses,
                                            isOptionSelected(option.value)
                                                ? 'bg-[var(--color-secondary)] white-text hover:bg-[var(--color-secondary)]'
                                                : activeOptionIndex === index
                                                  ? 'bg-[var(--color-secondary-hover-light)] hover:bg-[var(--color-secondary-hover-light)] text-[var(--color-black)]'
                                                  : 'bg-white hover:bg-[var(--color-secondary-hover-light)] hover:text-[var(--color-black)]',
                                            // isOptionSelected(option.value) ||
                                            // activeOptionIndex === index
                                            //     ? 'bg-[var(--color-secondary)] hover:bg-[var(--color-table-hover)] white-text hover:text-[var(--color-black)]'
                                            //     : 'bg-white hover:bg-[var(--color-table-hover)] hover:text-[var(--color-black)]',
                                            index === 0 ? 'border-t-[var(--color-border)]' : '',
                                        ]"
                                        @click.stop="() => setSelectedOption(option.value)"
                                    >
                                        {{ option.label }}
                                    </p>
                                    <p
                                        v-if="getArrayLength(optionsList) === 0"
                                        :class="optionLabelClasses"
                                    >
                                        No results
                                    </p>
                                </div>
                            </edc-transition-visibility>
                        </teleport>
                        <edc-transition-visibility v-else>
                            <div
                                v-if="showOptions"
                                ref="optionPicker"
                                class="options-container transition-all box-shadow-mild absolute left-0 bg-[var(--color-white)] z-[1000] rounded-[0.5rem] w-full"
                            >
                                <p
                                    v-for="(option, index) of optionsList"
                                    :key="`${option.label}-${index}`"
                                    class="transition-all cursor-pointer input-font px-[1rem] py-[0.5rem] text-left"
                                    :class="[
                                        optionLabelClasses,
                                        // isOptionSelected(option.value)
                                        //     ? 'bg-[var(--color-secondary)] hover:bg-[var(--color-table-hover)] white-text'
                                        //     : 'bg-white hover:bg-[var(--color-table-hover)] hover:text-[var(--color-black)]',
                                        isOptionSelected(option.value)
                                            ? 'bg-[var(--color-secondary)] white-text hover:bg-[var(--color-secondary)]'
                                            : activeOptionIndex === index
                                              ? 'bg-[var(--color-secondary-hover-light)] hover:bg-[var(--color-secondary-hover-light)] text-[var(--color-black)]'
                                              : 'bg-white hover:bg-[var(--color-secondary-hover-light)] hover:text-[var(--color-black)]',
                                        'border-[0.05rem] border-b-[var(--color-border)]',
                                        index === 0 ? 'border-t-[var(--color-border)]' : '',
                                    ]"
                                    @click.stop="() => setSelectedOption(option.value)"
                                >
                                    {{ option.label }}
                                </p>
                                <p
                                    v-if="getArrayLength(optionsList) === 0"
                                    :class="[optionLabelClasses, '!pointer-events-none']"
                                >
                                    No results
                                </p>
                            </div>
                        </edc-transition-visibility>
                    </template>
                    <input
                        v-else
                        :id="getInputId()"
                        :value="getInputValue || getDefaultValue"
                        type="text"
                        :class="inputClasses"
                        :readonly="readOnly"
                        @input="onInput($event)"
                    />
                </div>
                <edc-text-input
                    v-if="showSpecifyEntry"
                    v-model="specifyModel"
                    type="text"
                    container-class="w-[30%]"
                    :input-class="inputClass"
                    placeholder="Specify"
                    :tabindex="getTabIndexByIndex(tabIndexes, 1)"
                />
            </div>
            <edc-error-text :error="error" container-class="mt-[0.3rem]" />
            <!-- :container-class="`${isSpecifyEntry ? 'mt-[0.3rem]' : '-mt-[0.2rem]'}`" -->
        </div>
    </div>
</template>

<!-- <style>
    .visibility-enter-active,
    .visibility-leave-active {
        transition: opacity 0.2s ease;
    }

    .visibility-enter-from,
    .visibility-leave-to {
        opacity: 0;
    }
</style> -->
<style scoped>
    .container {
        display: flex;
        flex-direction: column;
        gap: 0rem;
    }

    /* .text-label {
        width: 100%;
    } */

    div.options-container {
        border: 0.1rem solid var(--color-grey);
        max-height: 20.5rem;
        overflow-y: auto;
    }

    div.options-container p:first-child {
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
    }
    div.options-container p:last-child {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
    }
</style>
<!-- class="options-container transition-all box-shadow-mild absolute top-[3.5rem] left-0 w-full bg-[var(--color-white)] z-[1000] rounded-[0.5rem]" -->
<!-- :class="[
                bottom >= 500
                    ? 'top-auto bottom-full'
                    : 'bottom-auto top-full',
            ]" -->
