import { Router } from 'express'
import { FolderRepository } from '../repositories/folder-repository.js'

const folderRoute = Router();
const folderRepository = FolderRepository()

folderRoute.get('/', async (req, res) => {
    try {
        const result = await folderRepository.findAll()
        if (result) {
            return res.status(200).json(result)
        }
        return res.status(404).send()
    } catch (error) {
        return res.status(400).send()
    }
})

folderRoute.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await folderRepository.findById(id)
        if (result) {
            return res.status(200).json(result)
        }
        return res.status(404).send()
    } catch (error) {
        return res.status(400).send()
    }
})

folderRoute.post('/', async (req, res) => {
    try {
        const { name } = req.body
        await folderRepository.create(name)
        return res.status(201).send()
    } catch (error) {
        return res.status(400).send()
    }
})

folderRoute.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const data = req.body
        const result = await folderRepository.update(id, data)
        if (result) {
            return res.status(204).send()
        }
        return res.status(404).send()
    } catch (error) {
        return res.status(400).send()
    }
})

folderRoute.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        await folderRepository.deleteById(id)
        res.status(204).send()
    } catch (error) {
        res.status(400).send()
    }
})

export default folderRoute
