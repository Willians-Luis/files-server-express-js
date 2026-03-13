import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { FileRepository } from '../repositories/file-repository.js'
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pipelineAsync = promisify(pipeline)

const fileRoute = Router()
const fileRepository = FileRepository()


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

        // Deleta do banco primeiro (transação lógica)
        const result = await fileRepository.deleteByFilename(filename)

        // Depois deleta o arquivo físico (se existir)
        try {
            await fs.promises.unlink(filePath)
        } catch (fileError) {
            // Se o arquivo não existir, não é erro crítico
            if (fileError.code !== 'ENOENT') {
                console.warn('Erro ao deletar arquivo físico:', fileError)
            }
        }

        // Retorna sucesso independente se existia ou não (idempotente)
        res.status(204).send()

    } catch (error) {
        console.error('Erro ao deletar arquivo:', error)
        res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
})


fileRoute.post('/upload/folder/:id', async (req, res) => {
    let tempDir, finalFilePath, newFilename

    try {
        const { id } = req.params

        // 1. Captura e decodifica o nome original vindo do header
        const rawFileName = decodeURIComponent(req.headers['file-name'] || '')
        const chunkIndex = parseInt(req.headers['chunk-index'])
        const totalChunks = parseInt(req.headers['total-chunks'])
        const mimeType = req.headers['content-type'] || 'application/octet-stream'

        if (!rawFileName) {
            return res.status(400).json({ error: 'Nome do arquivo não especificado' })
        }

        // 2. Diretório temporário (usamos o nome bruto aqui apenas para a pasta de chunks)
        tempDir = path.resolve(__dirname, '../../uploads/temp', rawFileName)
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`)
        await pipelineAsync(req, fs.createWriteStream(chunkPath))

        // Se não for o último chunk, apenas confirma recebimento
        if (chunkIndex !== totalChunks - 1) {
            return res.status(200).json({
                message: 'Chunk recebido com sucesso',
                received: chunkIndex + 1,
                total: totalChunks
            });
        }

        // --- PROCESSAMENTO DO ÚLTIMO CHUNK (MONTAGEM FINAL) ---

        // 3. Lógica de Limpeza e Formatação do Nome (Igual ao que fizemos no Multer)
        const fileExt = path.extname(rawFileName)
        const fileNameOnly = path.basename(rawFileName, fileExt)

        const cleanName = fileNameOnly
            .normalize('NFD') // Remove acentos
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
            .trim()
            .replace(/\s+/g, '_')     // Espaços para underscore
            .toLowerCase();

        const time = new Date().getTime()
        newFilename = `${cleanName}_${time}${fileExt}` // Nome limpo + timestamp + extensão

        finalFilePath = path.resolve(__dirname, '../../uploads', newFilename)

        // 4. Criar arquivo final unindo os chunks
        await mergeChunks(tempDir, totalChunks, finalFilePath)

        // Verificar se o arquivo final foi criado
        if (!fs.existsSync(finalFilePath)) {
            throw new Error('Erro: O arquivo final não pôde ser gerado no disco.')
        }

        const fileStats = fs.statSync(finalFilePath)

        // 5. Salvar no banco de dados
        let result;
        try {
            result = await fileRepository.create({
                name: newFilename,     // Nome para exibição
                filename: newFilename, // Nome real do arquivo no disco
                mimetype: mimeType,
                size: fileStats.size,
                folderId: id
            });
        } catch (dbError) {
            console.error('Erro no banco de dados:', dbError)
            if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
            return res.status(500).json({ error: 'Erro ao salvar no banco de dados' })
        }

        // 6. Limpeza do diretório temporário
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }

        return res.status(201).json({
            message: 'Upload realizado com sucesso',
            filename: newFilename, // Retorna o nome novo para o Front-end
            fileId: result.id
        });

    } catch (error) {
        console.error('Erro no upload:', error)

        // Cleanup em caso de erro catastrófico
        if (tempDir && fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true })
        if (finalFilePath && fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath)

        res.status(500).json({ error: 'Erro interno do servidor', message: error.message })
    }
});

// Função auxiliar para merge dos chunks (Mantenha fora da rota)
async function mergeChunks(tempDir, totalChunks, finalFilePath) {
    const writeStream = fs.createWriteStream(finalFilePath)

    return new Promise(async (resolve, reject) => {
        writeStream.on('error', reject)
        writeStream.on('finish', resolve)

        try {
            for (let i = 0; i < totalChunks; i++) {
                const currentChunkPath = path.join(tempDir, `chunk-${i}`)

                if (!fs.existsSync(currentChunkPath)) {
                    throw new Error(`Chunk ${i} faltando.`)
                }

                const chunkData = await fs.promises.readFile(currentChunkPath);
                writeStream.write(chunkData)

                // Opcional: deletar chunk imediatamente para poupar espaço na Orange Pi
                await fs.promises.unlink(currentChunkPath)
            }
            writeStream.end()
        } catch (error) {
            writeStream.destroy()
            reject(error)
        }
    })
}


fileRoute.get('/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename
        const filePath = path.resolve(__dirname, '../../uploads', filename)

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Arquivo não encontrado')
        }

        // Força o download mesmo para tipos que o navegador tentaria exibir
        res.download(filePath, filename)
    } catch (error) {
        res.status(500).send('Erro interno do servidor')
    }
})

fileRoute.get('/stream/:filename', (req, res) => {
    // Decodifica o nome do arquivo (ex: de %20 para espaço)
    const filename = decodeURIComponent(req.params.filename)
    const safeFilename = path.basename(filename);
    const filePath = path.resolve(__dirname, '../../uploads', safeFilename)

    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath)
        const fileSize = stat.size
        const range = req.headers.range

        // Extrair extensão para o Content-Type correto
        const ext = path.extname(filename).toLowerCase()
        const mimeTypes = {
            '.mkv': 'video/x-matroska',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream'

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
                'Content-Type': contentType,
            };

            res.writeHead(206, head)
            file.pipe(res)
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': contentType,
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res)
        }
    } else {
        res.status(404).send('Arquivo não encontrado')
    }
})

export default fileRoute