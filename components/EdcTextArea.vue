<script setup lang="ts">
    import type { TNullableString } from "~/types/common";
    import type { ITextAreaProps } from "~/types/form-generation";
    

    const modelValue = defineModel<TNullableString>({
        default: null,
    });

    const props = withDefaults(defineProps<ITextAreaProps>(), {
        cols: 50,
        rows: 4,
        label: "",
        elementId: "",
        containerClass: "",
        inputContainerClass: "",
        labelContainerClass: "",
        inputClass: "",
        labelClass: "",
        disabled: false,
        placeholder: "",
        required: false,
        readOnly: false,
        error: "",
        showCharacterCount: false,
        max: 1000,
        ellipseCount: 50,
        showHelpText: false,
        helpText: null,
        tabindex: undefined,
    });

    const emit = defineEmits<{
        "on-input": [];
        "on-focus": [event: FocusEvent];
        "on-model-change": [];
    }>();

    const { width } = useWindowSize();
    const inputRef = ref(null);

    const getInputId = useMemoize(
        () => props.elementId || convertWordsIntoCasedWords(props.label || "", "camel case"),
    );

    const getContainerClass = () => `container ${props.containerClass}`.trim();
    // const getLabelClass = () => `input-label input-font text-label ${props.labelClass}`.trim();

    const inputClasses = computed(() => ({
        "input-value form-input": true,
        [props.inputClass]: props.inputClass,
        "input-font": !props.inputClass.includes("font"),
        "readonly-form-input cursor-default resize-none": props.readOnly,
    }));

    const inputContainerClasses = computed(() => ({
        "relative var(--border-radius-6)": true,
        [props.inputContainerClass]: props.inputContainerClass,
    }));

    const errorAndCountContainerClasses = computed(() => ({
        "flex flex-row items-center": true,
        "justify-between": props.error && props.showCharacterCount && !props.readOnly,
        "justify-start": props.error && !(props.showCharacterCount && !props.readOnly),
        "justify-end": !props.error && props.showCharacterCount && !props.readOnly,
    }));

    function calculateTextWidth(text: string) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
            context.font =
                width.value < 1024 ? "1.1rem Avenir LT Std Book" : "1.4rem Avenir LT Std Book"; // Use the same font as the input field
            return context.measureText(text).width;
        }
        return -1;
    }

    function updateText(concatString: string) {
        let textIndex = -1;
        if (inputRef.value) {
            // Calculate the available width of the input field
            const availableWidth = inputRef.value
                ? (inputRef.value as HTMLInputElement).clientWidth * 0.8
                : 0;

            // Temporarily apply the full text to measure its width
            const textWidth = calculateTextWidth(concatString);

            if (textWidth !== -1 && textWidth > availableWidth) {
                textIndex = Math.floor(concatString.length * (availableWidth / textWidth));
            }
        }
        return textIndex;
    }

    const ellipsedText = computed(() => {
        // let result = "";
        // if (modelValue.value && getStringLength(modelValue.value) > props.ellipseCount)
        //     result = `${modelValue.value.slice(0, props.ellipseCount)}...`;
        // else if (modelValue.value) result = modelValue.value;
        // return result;
        let result = "";
        const ellipseCountRef = updateText(modelValue.value || "");
        if (modelValue.value && getStringLength(modelValue.value) > ellipseCountRef)
            result = `${modelValue.value.slice(0, ellipseCountRef)}...`;
        else if (modelValue.value) result = modelValue.value;
        return result;
    });

    const characterCount = computed(() => getStringLength(modelValue.value));

    function handleInputChange() {
        if (!modelValue.value) modelValue.value = null;
        emit("on-input");
        emit("on-model-change");
    }

    function handleOnFocus(event: FocusEvent) {
        emit("on-focus", event);
    }

    watch(
        () => modelValue.value,
        (newValue) => {
            if (newValue && getStringLength(newValue) > props.max)
                modelValue.value = newValue.slice(0, props.max);
        },
    );
</script>

<template>
    <div :class="getContainerClass()">
        <!-- <label v-if="label" :for="getInputId()" :class="getLabelClass()">
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
        <div :class="inputContainerClasses" :disabled="isElementDisabled(disabled && !readOnly)">
            <textarea
                v-if="!readOnly"
                :id="getInputId()"
                v-model="modelValue"
                :rows="rows"
                :cols="cols"
                :class="inputClasses"
                :disabled="isElementDisabled(disabled)"
                :placeholder="placeholder || ''"
                :readonly="readOnly"
                :tabindex="tabindex"
                @input="
                    () => {
                        handleInputChange();
                    }
                "
                @focus="handleOnFocus($event)"
            />
            <!-- <p
                v-else
                :class="[inputClasses, 'max-w-[60rem] overflow-hidden bg-green-300 text-ellipsis']"
            >
                {{ modelValue }}
            </p> -->
            <!-- <input
                v-else
                :id="getInputId()"
                v-model="modelValue"
                type="text"
                :class="inputClasses"
                :placeholder="placeholder || ''"
                :readonly="readOnly"
            /> -->
            <textarea
                v-else-if="ellipsedText.includes('...')"
                :id="getInputId()"
                ref="inputRef"
                v-tooltip.top="modelValue"
                :rows="1"
                :cols="cols"
                :class="[inputClasses, 'overflow-hidden']"
                :value="ellipsedText"
                :readonly="readOnly"
            />
            <textarea
                v-else
                :id="getInputId()"
                :rows="1"
                :cols="cols"
                :class="[inputClasses, 'overflow-hidden']"
                :value="modelValue"
                :readonly="readOnly"
            />
        </div>
        <div :class="errorAndCountContainerClasses">
            <edc-error-text :error="error" container-class="-mt-[0.5rem]" />
            <span
                v-if="showCharacterCount && !readOnly"
                class="-mt-[0.5rem] text-[1.1rem] inline-block self-end"
                >{{ characterCount }} / {{ max }}</span
            >
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
