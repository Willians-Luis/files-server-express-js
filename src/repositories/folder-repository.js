import { prisma } from "./prisma-client.js";


function FolderRepository() {
    const create = async (name) => {
        const result = await prisma.folder.create({
            data: {
                name,
            }
        })

        return result
    }

    const findById = async (id) => {
        const result = await prisma.folder.findFirst({
            where: {
                id,
            }
        })

        return result
    }

    const findAll = async () => {
        const result = await prisma.folder.findMany()

        return result
    }

    const update = async (id, data) => {
        const result = await prisma.folder.update({
            where: {
                id,
            },
            data: {
                ...data,
            }
        })

        return result
    }

    const deleteById = async (id) => {
        const result = await prisma.folder.delete({
            where: {
                id,
            }
        })

        return result
    }

    return { create, findById, findAll, update, deleteById }
}

export { FolderRepository }