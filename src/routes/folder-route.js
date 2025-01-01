import { Router } from 'express';
import { FolderRepository } from '../repositories/folder-repository.js';

const folderRoute = Router();
const folderRepository = FolderRepository()

folderRoute.get('/', async (req, res) => {
    try {
        const result = await folderRepository.findAll()

        res.status(200).json(result)
    } catch (error) {
        res.status(404).send()
    }
})

folderRoute.post('/', async (req, res) => {
    const { name } = req.body

    const result = await folderRepository.create(name)

    if (result) {
        res.status(201).send()
    }

    res.status(400).send()
})

folderRoute.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const file = req.body

        await folderRepository.update(id, file)

        res.status(201).send()
    } catch (error) {
        res.status(400).send()
    }
})

folderRoute.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        await folderRepository.deleteById(id)

        res.status(200).send()
    } catch (error) {
        res.status(400).send()
    }
})

export default folderRoute;
