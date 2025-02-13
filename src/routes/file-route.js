import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import storage from '../multer-config/index.js'
import { FileRepository } from '../repositories/file-repository.js'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fileRoute = Router();
const fileRepository = FileRepository()
const upload = multer({ storage: storage })

fileRoute.get('/folder/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await fileRepository.findAllByFolderId(id)
        return res.status(200).json(result)
    } catch (error) {
        return res.status(400).send()
    }
})

fileRoute.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await fileRepository.findById(id)
        if (result) {
            return res.status(200).json(result)
        }
        return res.status(404).send()
    } catch (error) {
        return res.status(400).send()
    }
})


fileRoute.post('/upload/folder/:id', upload.single("file"), async (req, res) => {
    try {
        const { id } = req.params
        const file = req.file
        if (file) {
            const result = await fileRepository.create({
                name: file.filename,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                folderId: id
            })
            if (result) {
                return res.status(201).send()
            }
        }
        return res.status(400).send()
    } catch (error) {
        return res.status(400).send()
    }
})

fileRoute.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const file = req.body
        await fileRepository.update(id, file)
        return res.status(204).send()
    } catch (error) {
        return res.status(400).send()
    }
})

fileRoute.delete('/:filename', async (req, res) => {
    try {
        const { filename } = req.params
        const filePath = path.resolve(__dirname, '../../uploads', filename)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            const result = await fileRepository.deleteByFilename(filename)
            if (result) {
                return res.status(204).send()
            } else {
                return res.status(500).send()
            }
        } else {
            return res.status(404).send()
        }
    } catch (error) {
        return res.status(500).send()
    }
})

fileRoute.get('/download/:filename', (req, res) => {
    const filename = req.params.filename
    const filePath = path.resolve(__dirname, '../../uploads', filename)
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath)
    } else {
        return res.status(404).send()
    }
})

fileRoute.get('/stream/:filename', (req, res) => {
    const filename = req.params.filename
    const filePath = path.resolve(__dirname, '../../uploads', filename)
    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath)
        const fileSize = stat.size
        const range = req.headers.range
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
            const chunkSize = (end - start) + 1
            const file = fs.createReadStream(filePath, { start, end })
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(206, head)
            return file.pipe(res)
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head)
            return fs.createReadStream(filePath).pipe(res)
        }
    } else {
        return res.status(404).send()
    }
})

export default fileRoute
