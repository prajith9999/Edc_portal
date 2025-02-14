<script setup lang="ts">
    import type { ICheckboxProps } from "~/types/form-generation";

    const modelValue = defineModel<boolean>({
        default: false,
    });
    const props = withDefaults(defineProps<ICheckboxProps>(), {
        label: "",
        elementId: "",
        containerClass: "",
        inputClass: "",
        labelClass: "",
        checked: false,
        required: false,
        error: null,
        value: "",
        readOnly: false,
        disabled: false,
        setCheckedToModel: false,
        tabindex: undefined,
    });

    const emit = defineEmits<{
        "on-change": [checked: boolean];
    }>();

    const getInputId = useMemoize(
        () =>
            props.elementId ||
            convertWordsIntoCasedWords(
                props.label ? `${props.name}_${props.label}` : "",
                "camel case",
            ),
    );

    const getContainerClass = () => `container w-fit ${props.containerClass || ""}`.trim();

    const inputClasses = computed(() => ({
        "input-value radio-input !w-fit": true,
        [props.inputClass]: props.inputClass,
        "input-font": !props.inputClass.includes("font"),
    }));

    function onChange() {
        const changedValue = modelValue.value as boolean;
        emit("on-change", changedValue);
    }

    onMounted(() => {
        if (props.setCheckedToModel) modelValue.value = props.checked;
    });
</script>

<template>
    <div :class="getContainerClass()" :disabled="isElementDisabled(disabled && !readOnly)">
        <edc-form-label
            :input-id="getInputId()"
            :label="label"
            :required="required"
            :label-class="labelClass"
            :disabled="disabled"
        />
        <div class="relative flex flex-col">
            <input
                v-if="!readOnly"
                :id="getInputId()"
                v-model="modelValue"
                :value="value"
                type="checkbox"
                :class="inputClasses"
                :name="name"
                :disabled="isElementDisabled(disabled) && !readOnly"
                :checked="checked"
                :tabindex="tabindex"
                @click.stop
                @change="onChange()"
            />
            <edc-icon
                v-else-if="modelValue"
                icon="check"
                class="fill-[var(--color-secondary)] h-[0.8rem]"
            />
            <!-- class="hidden" -->
            <!-- <span class="checkbox-proxy" /> -->
            <edc-error-text :error="error" container-class="mt-[0.3rem]" />
        </div>
    </div>
</template>

<!-- <style>
    .container input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }
    
    .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        height: 25px;
        width: 25px;
        background-color: #eee;
    }

    /* On mouse-over, add a grey background color */
    .container:hover input ~ .checkmark {
        background-color: #ccc;
    }

    /* When the checkbox is checked, add a blue background */
    .container input:checked ~ .checkmark {
        background-color: #2196f3;
    }

    /* Create the checkmark/indicator (hidden when not checked) */
    .checkmark:after {
        content: "";
        position: absolute;
        display: none;
    }

    /* Show the checkmark when checked */
    .container input:checked ~ .checkmark:after {
        display: block;
    }

    /* Style the checkmark/indicator */
    .container .checkmark:after {
        left: 9px;
        top: 5px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 3px 3px 0;
        -webkit-transform: rotate(45deg);
        -ms-transform: rotate(45deg);
        transform: rotate(45deg);
    }
</style> -->
<style scoped>
    .container {
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
        gap: 0.5rem;
    }

    /* .text-label {
        width: 100%;
    } */

    /* span.checkbox-proxy {
        width: 16px;
        height: 16px;
        border: 1px solid #ccc;
        display: inline-block;
        border-radius: 50%;
        transition: all linear 0.3s;
    }

    span.checkbox-proxy:after {
        content: "";
        position: absolute;
        top: -1px;
        left: 6px;
        border-bottom: 2px solid #fff;
        border-right: 2px solid #fff;
        height: 9px;
        width: 4px;
        transform: rotate(45deg);
        visibility: hidden;
    }

    input[type="checkbox"]:checked ~ span.checkbox-proxy {
        background: #ccc;
    }

    input[type="checkbox"]:checked:after {
        visibility: visible;
    } */
</style>
