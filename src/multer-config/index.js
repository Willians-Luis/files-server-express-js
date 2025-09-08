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
            fs.mkdirSync(uploadDir)
        }
        callback(null, uploadDir)
    },
    filename: (req, file, callback) => {
        const time = new Date().getTime()
        callback(null, `temp_${time}_${file.originalname}`)
    }
})


const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB em bytes
  },
})

export default upload