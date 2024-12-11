export function categoryRename(mimetype) {
    if (mimetype.includes("rar") || mimetype.includes("zip") || mimetype.includes("x-tar")) {
        return "compacto"
    } else if ( mimetype.includes("audio")) {
        return "audio"
    } else if ( mimetype.includes("video")) {
        return "video"
    } else if ( mimetype.includes("image")) {
        return "imagem"
    } else if ( mimetype.includes("pdf")) {
        return "pdf"
    }

    return null
} 