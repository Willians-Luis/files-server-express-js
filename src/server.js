import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { storage } from './multerConfig.js';
import { CategoriesRepository } from './repository/categories.repository.js';
import { FilesRepository } from './repository/files.repository.js';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const upload = multer({ storage: storage });
const filesRepository = FilesRepository()
const categoriesRepository = CategoriesRepository()
const app = express()
const port = 3333
const host = '0.0.0.0'

// const cors = require('cors');

// app.use(cors({
//     origin: 'https://example.com', // Substitua pelo domínio permitido ou use '*' para permitir todos os domínios (não recomendado em produção)
// }));



app.get('/category', async (req, res) => {
    const result = await categoriesRepository.findAll()

    if (result) {
        res.status(200).json(result)
    }

    res.status(404).send()
})


app.get('/list/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId

    const result = await filesRepository.findAll(categoryId)

    if (result) {
        res.status(200).json(result)
    }

    res.status(404).send()
})


app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded' });
    }

    const result = await filesRepository.create(req.file)

    if (result) {
        res.status(201).send()
    }

    res.status(400).send()
})



app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.resolve(__dirname, 'uploads', filename);

    // Verifica se o arquivo existe antes de enviá-lo
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send({ error: 'File not found' });
    }
})

app.get('/stream/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.resolve(__dirname, 'uploads', filename);

    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    } else {
        res.status(404).send({ error: 'File not found' });
    }
})



categoriesRepository.createAutomatic()


app.listen(port, host, () => {
    console.log(`Server running at http://localhost:${port}/`);
})

