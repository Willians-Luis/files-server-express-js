import { prisma } from "./prisma-client.js";


function FileRepository() {
    const create = async (data) => {
        const result = await prisma.file.create({
            data: {
                ...data
            }
        })

        return result
    }

    const findById = async (id) => {
        const result = await prisma.file.findFirst({
            where: {
                id,
            }
        })

        return result
    }

    const findAllByFolderId = async (id) => {
        const result = await prisma.file.findMany({
            where: {
                folderId: id
            }
        })

        return result
    }

    const update = async (id, data) => {
        const result = await prisma.file.update({
            where: {
                id,
            },
            data: {
                ...data,
            }
        })

        return result
    }

    const deleteByFilename = async (filename) => {
        const result = await prisma.file.deleteMany({
            where: {
                filename
            }
        })
        
        return result
    }

    return { create, findById, findAllByFolderId, update, deleteByFilename }
}

export { FileRepository }