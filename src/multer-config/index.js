// não utilizado

import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const uploadDir = path.resolve(__dirname, '../../uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        callback(null, uploadDir)
    },
    filename: (req, file, callback) => {
        const time = new Date().getTime();

        // 1. Separa a extensão do nome (ex: "Video.mkv" -> ext = ".mkv", name = "Video")
        const fileExt = path.extname(file.originalname);
        const fileNameOnly = path.basename(file.originalname, fileExt);

        // 2. Limpa o nome (remove acentos, espaços e caracteres especiais)
        let cleanName = fileNameOnly
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim()                   // <-- Remove espaços no início e fim
            .replace(/\s+/g, '_')
            .toLowerCase();

        if (!cleanName) {
            cleanName = 'arquivo';
        }

        const finalName = `${cleanName}_${time}${fileExt}`;

        callback(null, finalName);
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 * 1024, // 10 GB em bytes
    },
})

export default upload