import type { TFilePreview } from "~/stores/data-collection";

// eslint-disable-next-line require-await
export default async function convertBase64(file: File) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);

        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.onerror = (error) => {
            reject(error);
        };
    });
}

export function getFileName(filePath: string) {
    const splittedFilePaths = String(filePath).split("/");
    return splittedFilePaths[getArrayLength(splittedFilePaths) - 1];
}

export function getFileType(file: TFilePreview) {
    let result = "";
    if (typeof file === "string") {
        if (file.includes("jpg") || file.includes("jpeg") || file.includes("png")) result = "image";
        else if (file.includes("mp4")) result = "video";
        else if (file.includes("pdf")) result = "pdf";
        else result = "other";
    } else if (file) {
        if (file.type.startsWith("image/")) result = "image";
        else if (file.type.startsWith("video/")) result = "video";
        else if (file.type.startsWith("application/pdf")) result = "pdf";
        else result = "other";
    }
    return result;
}

export function removeExtension(text: string) {
    return text.slice(0, text.indexOf("."));
}

// async function getBase64Files() {
//     const uploadedFiles: string[] = [];
//     for (const file of formModel.files) {
//         const base64String = (await convertBase64(file)) as string;
//         console.log("base64String", base64String);
//         uploadedFiles.push(base64String);
//     }
//     return [...uploadedFiles];
// }
