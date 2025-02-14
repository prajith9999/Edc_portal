<script setup lang="ts">
    import type { TNullableNumber, TNullableString } from "~/types/common";
    import type { ITextInputProps } from "~/types/form-generation";

    const modelValue = defineModel<TNullableString | TNullableNumber>({
        default: null,
    });

    const inputRef = ref();

    const props = withDefaults(defineProps<ITextInputProps>(), {
        label: "",
        elementId: "",
        containerClass: "",
        inputContainerClass: "",
        inputClass: "",
        labelClass: "",
        labelContainerClass: "",
        placeholder: "",
        required: false,
        error: "",
        disabled: false,
        readOnly: false,
        minLength: 0,
        maxLength: 1000,
        wholePart: () => ({
            minLength: -1,
            maxLength: -1,
        }),
        fractionalPart: () => ({
            minLength: -1,
            maxLength: -1,
        }),
        tooltipText: "",
        showTooltip: false,
        tooltipPlacement: "top",
        showHelpText: false,
        helpText: null,
        onKeyUp: () => {},
        tabindex: undefined,
        disableDefaultValueSetter: false,
        showCharacterCount: false,
    });

    const emit = defineEmits<{
        "on-input": [inputValue: TNullableString | TNullableNumber];
        "on-focus": [event: FocusEvent];
    }>();

    const showPassword = ref<boolean>(false);
    const isInputFocused = ref<boolean>(false);

    const isTextEllipsed = computed(() => {
        let result = false;
        if (inputRef.value && (modelValue.value || !modelValue.value)) {
            const inputElementRef = inputRef.value as HTMLInputElement;
            // console.log("inputElementRef.scrollWidth", inputElementRef.scrollWidth);
            // console.log("inputElementRef.offsetWidth", inputElementRef.offsetWidth);
            if (inputElementRef.offsetWidth < inputElementRef.scrollWidth) result = true;
        }
        return result;
    });

    const tooltip = computed(() => props.tooltipText || modelValue.value);

    const getInputId = useMemoize(
        () => props.elementId || convertWordsIntoCasedWords(props.label || "", "camel case"),
    );
    // const getInputId = computed(
    //     () => props.elementId || convertWordsIntoCasedWords(props.label || "", "camel case"),
    // );

    const getContainerClass = () => `container relative ${props.containerClass}`.trim();
    // const labelClasses = computed(() => ({
    //     "input-value text-label": true,
    //     [props.labelClass]: props.labelClass,
    //     "input-font": !props.labelClass.includes("font"),
    // }));
    const inputClasses = computed(() => ({
        "input-value form-input text-ellipsis": true,
        [props.inputClass]: props.inputClass,
        "input-font": !props.inputClass.includes("font"),
        "pointer-events-none readonly-form-input": props.readOnly,
    }));

    const inputContainerClasses = computed(() => ({
        "relative flex flex-col rounded-[var(--border-radius-6)]": true,
        [props.inputContainerClass]: props.inputContainerClass,
    }));

    const getInputType = () => {
        let inputType = props.type;
        if (props.type === "password" && showPassword.value) inputType = "text";
        return inputType;
    };

    function handleInputChange() {
        if (
            !props.disableDefaultValueSetter &&
            (modelValue.value === null || modelValue.value === "")
        )
            modelValue.value = null;
        // if (modelValue.value === "") modelValue.value = null;
        emit("on-input", modelValue.value);
    }

    // function validateInput(event: KeyboardEvent) {
    //     // console.log("event in validateInput", event);
    //     // console.log("event.key", event.key);
    //     // console.log("event.metaKey", event.metaKey);
    //     // console.log("event.ctrlKey", event.ctrlKey);
    //     // console.log("event.target.value", event.target.value);
    //     // console.log("event.target.selectionStart", event.target.selectionStart);
    // }
    // @keydown="validateInput($event)"

    function handleOnFocus(event: FocusEvent) {
        isInputFocused.value = true;
        emit("on-focus", event);
    }

    // watch(
    //     () => modelValue.value,
    //     (newValue, oldValue) => {
    //         let appendOldValue = false;
    //         console.log("newValue", newValue, typeof newValue);
    //         console.log("oldValue", oldValue, typeof oldValue);
    //         console.log("modelValue.value", modelValue.value, typeof modelValue.value);
    //         // if (props.type === "number") {
    //         //     if (
    //         //         typeof newValue === "number" &&
    //         //         (newValue < props.minLength || newValue > props.maxLength)
    //         //     )
    //         //         appendOldValue = true;
    //         //     else if (typeof newValue === "number" && newValue !== null) {
    //         //         const splitByDecimalDigits = String(newValue).split(".");
    //         //         if (
    //         //             getArrayLength(splitByDecimalDigits) === 2 &&
    //         //             getStringLength(splitByDecimalDigits[1]) > props.fractionalPart.maxLength
    //         //         )
    //         //             appendOldValue = true;
    //         //     }
    //         // } else if (newValue && getStringLength(newValue) > props.maxLength)
    //         //     appendOldValue = true;
    //         if (props.type === "number") {
    //             if (
    //                 typeof newValue === "number" &&
    //                 (getStringLength(String(newValue).replace("-", "")) < props.minLength ||
    //                     getStringLength(String(newValue).replace("-", "")) > props.maxLength)
    //             )
    //                 appendOldValue = true;
    //             else if (typeof newValue === "number" && newValue !== null) {
    //                 const splitByDecimalDigits = String(newValue).split(".");
    //                 if (
    //                     getArrayLength(splitByDecimalDigits) === 2 &&
    //                     getStringLength(splitByDecimalDigits[0].replace("-", "")) >
    //                         props.wholePart.maxLength &&
    //                     getStringLength(splitByDecimalDigits[1]) > props.fractionalPart.maxLength
    //                 )
    //                     appendOldValue = true;
    //             }
    //         } else if (newValue && getStringLength(newValue) > props.maxLength)
    //             appendOldValue = true;
    //         console.log("appendOldValue", appendOldValue);
    //         if (appendOldValue) modelValue.value = oldValue;
    //     },
    // );
    watch(
        () => modelValue.value,
        (newValue, oldValue) => {
            let appendOldValue = false;
            if (props.type === "number") {
                if (
                    typeof newValue === "number" &&
                    newValue !== null &&
                    props.wholePart.minLength !== -1 &&
                    props.wholePart.maxLength !== -1 &&
                    props.fractionalPart.minLength !== -1 &&
                    props.fractionalPart.maxLength !== -1
                ) {
                    const splitByDecimalDigits = String(newValue).split(".");
                    if (
                        getArrayLength(splitByDecimalDigits) === 2 &&
                        (getStringLength(splitByDecimalDigits[0].replace("-", "")) >
                            props.wholePart.maxLength ||
                            getStringLength(splitByDecimalDigits[1]) >
                                props.fractionalPart.maxLength)
                    )
                        appendOldValue = true;
                    else if (
                        getArrayLength(splitByDecimalDigits) === 1 &&
                        getStringLength(splitByDecimalDigits[0].replace("-", "")) >
                            props.wholePart.maxLength
                    )
                        appendOldValue = true;
                } else if (typeof newValue === "number") {
                    if (String(newValue).replace("-", "").includes(".")) appendOldValue = true;
                    else if (
                        getStringLength(String(newValue).replace("-", "")) < props.minLength ||
                        getStringLength(String(newValue).replace("-", "")) > props.maxLength
                    )
                        appendOldValue = true;
                }
                // else if (!newValue) appendOldValue = true;
            } else if (newValue && getStringLength(newValue) > props.maxLength)
                appendOldValue = true;
            if (appendOldValue) modelValue.value = oldValue;
        },
    );

    // function onKeyPress(event: KeyboardEvent) {
    //     const specialKeys = [
    //         "Backspace",
    //         "ArrowLeft",
    //         "ArrowRight",
    //         "Tab",
    //         "Delete",
    //         "Control",
    //         "F12",
    //         "Shift",
    //         "Home",
    //         "End",
    //     ];
    //     const { target, key, ctrlKey = false } = event;
    //     const { selectionStart: position, value } = target as any;
    //     let beginValue = String(value).slice(0, position);
    //     let endValue = String(value).slice(position);
    //     console.log("target", target);
    //     console.log("key", key);
    //     console.log("position", position);
    //     console.log("value", value);
    //     console.log("beginValue", beginValue);
    //     console.log("endValue", endValue);
    //     if (specialKeys.includes(key)) {
    //         if (key === "Backspace") beginValue = String(value).slice(0, position - 1);
    //         else if (key === "Delete") endValue = String(value).slice(position + 1);
    //     } else if (!ctrlKey) {
    //         const inputValue = `${beginValue}${key}${endValue}`;
    //         console.log("inputValue", inputValue, typeof inputValue);
    //         if (props.type === "text" && getStringLength(inputValue) > props.maxLength) {
    //             event.preventDefault();
    //         } else if (props.type === "number") {
    //             if (typeof Number(inputValue) !== "number") event.preventDefault();
    //             else if (typeof Number(inputValue) === "number") {
    //                 if (
    //                     props.wholePart.minLength !== -1 &&
    //                     props.wholePart.maxLength !== -1 &&
    //                     props.fractionalPart.minLength !== -1 &&
    //                     props.fractionalPart.maxLength !== -1
    //                 ) {
    //                     const splitByDecimalDigits = String(inputValue).split(".");
    //                     console.log("splitByDecimalDigits", splitByDecimalDigits);
    //                     if (getArrayLength(splitByDecimalDigits) === 2) {
    //                         if (
    //                             getStringLength(splitByDecimalDigits[0].replace("-", "")) >
    //                             props.wholePart.maxLength
    //                         )
    //                             event.preventDefault();
    //                         else if (splitByDecimalDigits[1].includes("-")) event.preventDefault();
    //                         else if (
    //                             getStringLength(splitByDecimalDigits[1]) >
    //                             props.fractionalPart.maxLength
    //                         )
    //                             event.preventDefault();
    //                     }
    //                 } else if (
    //                     getStringLength(String(inputValue).replace("-", "")) < props.minLength ||
    //                     getStringLength(String(inputValue).replace("-", "")) > props.maxLength
    //                 ) {
    //                     event.preventDefault();
    //                 }
    //             }
    //         }
    //     }
    // }

    function preventInputScroll(event: WheelEvent) {
        if (event.deltaX !== 0) event.preventDefault();
        else if (isInputFocused.value) event.preventDefault();
    }

    const characterCount = computed(() => getStringLength(modelValue.value));
</script>

<template>
    <div :class="getContainerClass()">
        <span v-if="props.showCharacterCount" class="text-[1.1rem]">{{ characterCount }} / {{ props.maxLength }}</span>
        <!-- <label v-if="label" :for="getInputId()" :class="labelClasses">
                {{ props.label }} <span v-if="required" class="text-[var(--color-error)]">*</span>
            </label> -->
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
        <!-- class="absolute top-0 left-0" -->
        <div
            v-tooltip="{
                content: (isTextEllipsed || showTooltip) && !!tooltip && String(tooltip),
                placement: tooltipPlacement,
            }"
            :class="inputContainerClasses"
        >
            <input
                :id="getInputId()"
                ref="inputRef"
                v-model="modelValue"
                :type="getInputType()"
                :class="inputClasses"
                :placeholder="(!readOnly && placeholder) || ''"
                :disabled="isElementDisabled(disabled) && !readOnly"
                :readonly="readOnly"
                :tabindex="tabindex"
                @input="handleInputChange()"
                @wheel="preventInputScroll($event)"
                @focus="handleOnFocus($event)"
                @blur="
                    () => {
                        isInputFocused = false;
                    }
                "
                @keyup.enter="
                    async () => {
                        await onKeyUp();
                    }
                "
            />
            <!-- @@wheel.prevent -->
            <!-- @wheel="
                    (event) => {
                        if (event && event.target) (event.target as HTMLElement).blur();
                    }
                " -->
            <!-- @keypress="onKeyPress($event)" -->
            <!-- <button
                    v-if="props.type === 'password'"
                    type="button"
                    class="transition-all absolute top-[50%] right-[0.5rem] -translate-y-1/2"
                    @click="() => (showPassword = !showPassword)"
                >
                    <edc-icon
                        :icon="showPassword ? 'eye' : 'eye-slash'"
                        class="fill-[#c0c0c0] hover:fill-black h-[2rem] w-[2rem]"
                    />
                </button> -->
            <edc-pressable
                v-if="props.type === 'password'"
                :disabled="isElementDisabled(disabled && !readOnly)"
                :container-class="`absolute ${error ? 'top-[32%]' : 'top-[50%]'} right-[0.5rem] -translate-y-1/2 hover:opacity-100`"
                :on-click="() => (showPassword = !showPassword)"
            >
                <edc-icon
                    :icon="showPassword ? 'eye' : 'eye-slash'"
                    class="fill-[var(--color-disabled)] hover:fill-[var(--color-secondary)] h-[2rem] w-[2rem]"
                />
            </edc-pressable>
            <edc-error-text :error="error" container-class="mt-[0.3rem]" />
            <span v-if="props.showCharacterCount" class="text-[1.1rem]">{{ characterCount }} / {{ props.maxLength }}</span>
        </div>
    </div>
</template>

<style scoped>
    .container {
        display: flex;
        flex-direction: column;
        gap: 0rem;
    }

    /* .text-label {
        width: 100%;
    } */
</style>
