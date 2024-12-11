import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const uploadDir = path.resolve(__dirname, 'uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir)
        }
        callback(null, uploadDir)
    },
    filename: (req, file, callback) => {
        if (
            file.mimetype.includes("audio")
            || file.mimetype.includes("video")
            || file.mimetype.includes("image")
            || file.mimetype.includes("pdf")
            || file.mimetype.includes("zip")
            || file.mimetype.includes("rar")
            || file.mimetype.includes("x-tar")
        ) {
            const time = new Date().getTime()
            callback(null, `${time}_${file.originalname}`)
        } else {
            callback(new Error('Tipo de arquivo não permitido'), false)
        }
    }
})

