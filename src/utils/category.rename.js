export function categoryRename(mimetype) {
    if ( mimetype.includes("audio")) {
        return "Audios"
    } else if ( mimetype.includes("video")) {
        return "Videos"
    } else if ( mimetype.includes("image")) {
        return "Imagens"
    } else {
        return "Outros"
    }
} 