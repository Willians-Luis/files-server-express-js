import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const cleanupTempFiles = async () => {
    console.log('Limpando a pasta temp...');
    const tempDir = path.resolve(__dirname, '../../uploads/temp');
    
    if (!fs.existsSync(tempDir)) {
        console.log('Diretório temp não existe, criando...');
        fs.mkdirSync(tempDir, { recursive: true });
        return;
    }
    
    try {
        // Remove todo o diretório e recria vazio
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('Pasta temp limpa com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar pasta temp:', error.message);
    }
};