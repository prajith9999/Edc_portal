<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import useDataCollectionStore from "~/stores/data-collection";

    interface ITabHeader {
        id: number;
        label: string;
        active: boolean;
    }

    const props = defineProps<{
        tabs: string[];
        activeIndex?: number;
        disableUnsavedCheck?: boolean;
    }>();

    const emit = defineEmits<{
        "on-tab-change": [tabIndex: number];
        "on-add-form": [];
    }>();

    const dataCollectionStore = useDataCollectionStore();

    // Scroll functionality
    const tabListRef = ref<HTMLElement | null>(null);
    const showLeftArrow = ref(false);
    const showRightArrow = ref(false);

    const carouselContainer = ref();
    const isCarouselContainerHovered = useElementHover(carouselContainer);

    const checkScrollButtons = () => {
        if (!tabListRef.value) return;

        const { scrollLeft, scrollWidth, clientWidth } = tabListRef.value;
        showLeftArrow.value = scrollLeft > 0;
        showRightArrow.value = scrollLeft < scrollWidth - clientWidth;
    };

    const scroll = (direction: "left" | "right") => {
        if (!tabListRef.value) return;

        const scrollAmount = 200; // Adjust this value to control scroll distance
        const targetScroll =
            tabListRef.value.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);

        tabListRef.value.scrollTo({
            left: targetScroll,
            behavior: "smooth",
        });
    };

    onMounted(() => {
        if (tabListRef.value) {
            checkScrollButtons();
            tabListRef.value.addEventListener("scroll", checkScrollButtons);
            // Initial check for overflow
            const { scrollWidth, clientWidth } = tabListRef.value;
            showRightArrow.value = scrollWidth > clientWidth;
        }
    });

    const isActiveTab = (index: number) =>
        typeof props.activeIndex === "undefined" && index === 0
            ? true
            : !!(typeof props.activeIndex === "number" && props.activeIndex === index);

    const setTabHeaders = (): ITabHeader[] =>
        props.tabs.map((tabRow, index) => ({
            id: index,
            label: tabRow,
            active: isActiveTab(index),
        }));

    const tabHeaders = ref<ITabHeader[]>([...setTabHeaders()]);
    const activeTabIndex = ref<number>(props.activeIndex || 0);

    function changeTab(tabIndex: number) {
        activeTabIndex.value = tabIndex;
        dataCollectionStore.clinicalTrialsInitialTabIndex = tabIndex;
        tabHeaders.value = tabHeaders.value.map((tabRow, index) => ({
            ...tabRow,
            active: index === tabIndex,
        }));
        if (tabIndex === 1) dataCollectionStore.dataCollectionDataViewType = "grid";
        emit("on-tab-change", tabIndex);
    }

    function handleChangeTab(tabIndex: number) {
        if (dataCollectionStore.triggerModelChanged === "unsaved" && !props.disableUnsavedCheck) {
            if (!window.confirm("Reload page confirmation message")) {
                // return false;
            } else {
                changeTab(tabIndex);
                dataCollectionStore.triggerModelChanged = "reset";
            }
        } else {
            changeTab(tabIndex);
        }
    }
</script>

<template>
    <div class="flex flex-col p-[1rem] tab-container">
        <section
            ref="carouselContainer"
            class="relative flex flex-row justify-between border-b-[0.1rem] border-[var(--color-gray-line)]"
        >
            <!-- Left scroll button -->
            <edc-pressable
                v-if="showLeftArrow"
                :container-class="`z-10 h-full opacity-100 left-0 absolute ${isCarouselContainerHovered ? 'opacity-100' : 'opacity-100 lg:opacity-0'}`"
                slot-wrapper-class="h-full"
                :on-click="
                    () => {
                        scroll('left');
                    }
                "
            >
                <div
                    class="px-[0.5rem] carousel-control h-full flex flex-row items-center justify-center"
                >
                    <edc-icon
                        icon="chevron-right-sharp"
                        class="transition-all !w-[2.5rem] !h-[2.5rem] rotate-180"
                        fill="var(--color-secondary)"
                    />
                </div>
            </edc-pressable>
            <ul
                ref="tabListRef"
                class="flex flex-row items-end gap-[1rem] overflow-x-auto tab-list-container scroll-smooth"
            >
                <li
                    v-for="(tabRow, index) of tabHeaders"
                    :key="tabRow.id"
                    :class="[
                        'transition-all border-b-[0.4rem] px-[1rem] pb-[0.5rem] whitespace-nowrap',
                        tabRow.active
                            ? 'border-b-[var(--color-active-tab)]'
                            : 'border-b-transparent',
                    ]"
                >
                    <edc-pressable :on-click="() => handleChangeTab(index)">
                        <span
                            class="text-[var(--color-tab-header)] md:text-[1.2rem] lg:text-[1.3rem] font-semibold"
                            >{{ tabRow.label }}</span
                        >
                    </edc-pressable>
                </li>
            </ul>

            <!-- Right scroll button -->
            <edc-pressable
                v-if="showRightArrow"
                :container-class="`z-10 h-full opacity-100 right-0 absolute ${isCarouselContainerHovered ? 'opacity-100' : 'opacity-100 lg:opacity-0'}`"
                slot-wrapper-class="h-full"
                :on-click="
                    () => {
                        scroll('right');
                    }
                "
            >
                <div
                    class="px-[0.5rem] carousel-control h-full flex flex-row items-center justify-center"
                >
                    <edc-icon
                        icon="chevron-right-sharp"
                        class="transition-all !w-[2.5rem] !h-[2.5rem] rotate-120"
                        fill="var(--color-secondary)"
                    />
                </div>
            </edc-pressable>

            <slot name="actions" v-bind="{ ...tabHeaders[activeTabIndex] }" />
        </section>

        <section class="py-[1rem]">
            <slot
                v-for="tabRow of tabHeaders.filter((tabRow) => tabRow.active)"
                :name="convertWordsIntoCasedWords(tabRow.label, 'camel case')"
            />
        </section>
    </div>
</template>

<style scoped>
    .tab-list-container {
        -ms-overflow-style: none;
        scrollbar-width: none;
        position: relative;
        scroll-behavior: smooth;
    }

    .tab-list-container::-webkit-scrollbar {
        display: none;
    }

    .scroll-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background-color: white;
        border: 1px solid var(--color-gray-line);
        border-radius: 50%;
        /* width: 32px; */
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* .carousel-control {
        background-color: rgb(0, 0, 0, 0.7);
    } */

    .scroll-button:hover {
        background-color: var(--color-gray-line);
    }

    .scroll-button:first-child {
        left: -16px;
    }

    .scroll-button:last-of-type {
        right: -16px;
    }

    .tab-enter-active,
    .tab-leave-active {
        transition: all 0.3s ease;
    }

    .tab-enter-from,
    .tab-leave-to {
        opacity: 0;
        transform: translateX(30px);
    }

    .tab-leave-active {
        position: absolute;
    }
</style>
