import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { FileRepository } from '../repositories/file-repository.js'


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
        const { filename } = req.params;
        const filePath = path.resolve(__dirname, '../../uploads', filename);

        // Deleta do banco primeiro (transação lógica)
        const result = await fileRepository.deleteByFilename(filename);
        
        // Depois deleta o arquivo físico (se existir)
        try {
            await fs.promises.unlink(filePath);
        } catch (fileError) {
            // Se o arquivo não existir, não é erro crítico
            if (fileError.code !== 'ENOENT') {
                console.warn('Erro ao deletar arquivo físico:', fileError);
            }
        }

        // Retorna sucesso independente se existia ou não (idempotente)
        res.status(204).send();
        
    } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

fileRoute.post('/upload/folder/:id', async (req, res) => {
    let tempDir, finalFilePath, newFilename;

    try {
        const { id } = req.params;
        const fileName = decodeURIComponent(req.headers['file-name']);
        const chunkIndex = parseInt(req.headers['chunk-index']);
        const totalChunks = parseInt(req.headers['total-chunks']);
        const mimeType = req.headers['content-type'] || 'application/octet-stream';

        if (!fileName) {
            return res.status(400).json({ error: 'Nome do arquivo não especificado' });
        }

        // Diretório temporário para chunks
        tempDir = path.resolve(__dirname, '../../uploads/temp', fileName);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
        await pipelineAsync(req, fs.createWriteStream(chunkPath));

        // Se não for o último chunk, apenas confirma recebimento
        if (chunkIndex !== totalChunks - 1) {
            return res.status(200).json({
                message: 'Chunk recebido com sucesso',
                received: chunkIndex + 1,
                total: totalChunks
            });
        }

        // Processamento do último chunk
        const time = new Date().getTime();
        newFilename = `${time}_${fileName}`;
        finalFilePath = path.resolve(__dirname, '../../uploads', newFilename);

        // Criar arquivo final de forma assíncrona
        await mergeChunks(tempDir, totalChunks, finalFilePath);

        // Verificar se o arquivo final foi criado
        if (!fs.existsSync(finalFilePath)) {
            throw new Error('Arquivo final não foi criado');
        }

        const fileStats = fs.statSync(finalFilePath);

        // Salvar no banco de dados com tratamento de erro específico
        let result;
        try {
            result = await fileRepository.create({
                name: newFilename,
                filename: newFilename,
                mimetype: mimeType,
                size: fileStats.size,
                folderId: id
            });
        } catch (dbError) {
            console.error('Erro no banco de dados:', dbError);
            // Remove arquivo se der erro no banco
            if (fs.existsSync(finalFilePath)) {
                fs.unlinkSync(finalFilePath);
            }
            return res.status(500).json({
                error: 'Erro ao salvar no banco de dados',
                details: dbError.message
            });
        }

        // Limpar diretório temporário
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        return res.status(201).json({
            message: 'Upload realizado com sucesso',
            filename: fileName,
            fileId: result.id // assumindo que o repository retorna o objeto salvo
        });

    } catch (error) {
        console.error('Erro no upload:', error);

        // Cleanup em caso de erro
        try {
            if (tempDir && fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            if (finalFilePath && fs.existsSync(finalFilePath)) {
                fs.unlinkSync(finalFilePath);
            }
        } catch (cleanupError) {
            console.error('Erro no cleanup:', cleanupError);
        }

        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// Função auxiliar para merge dos chunks
async function mergeChunks(tempDir, totalChunks, finalFilePath) {
    return new Promise(async (resolve, reject) => {
        const writeStream = fs.createWriteStream(finalFilePath);

        writeStream.on('error', reject);
        writeStream.on('finish', resolve);

        try {
            for (let i = 0; i < totalChunks; i++) {
                const currentChunkPath = path.join(tempDir, `chunk-${i}`);

                if (!fs.existsSync(currentChunkPath)) {
                    throw new Error(`Chunk ${i} não encontrado`);
                }

                const chunkData = await fs.promises.readFile(currentChunkPath);
                writeStream.write(chunkData);

                // Remover chunk após uso
                await fs.promises.unlink(currentChunkPath);
            }

            writeStream.end();
        } catch (error) {
            writeStream.destroy();
            reject(error);
        }
    });
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