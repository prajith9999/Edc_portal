interface IStyleStore {
    primary: string;
    secondary: string;
    accent: string;
}
const useStyleStore = defineStore("styleStore", () => {
    const colors = ref<IStyleStore>({
        primary: "#0842a0",
        secondary: "#a8c7fa",
        accent: "#757575",
    });
    return { colors };
});

export default useStyleStore;

export const getOnlyColorCode = (color: string) =>
    color.replace("bg-[", "").replace("]", "");
export const getPrimaryLight = () => `${useStyleStore().colors.primary}30`;

export const changeSectionBackgroundColor = () => {
    const rootSection = getDOMElement(":root");
    if (rootSection) {
        rootSection.style.setProperty(
            "--color-primary",
            useStyleStore().colors.primary
        );
        rootSection.style.setProperty(
            "--color-secondary",
            useStyleStore().colors.secondary
        );
        rootSection.style.setProperty(
            "--color-accent",
            useStyleStore().colors.accent
        );
    }
};
