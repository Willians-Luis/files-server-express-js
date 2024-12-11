import { prisma } from "../database/prisma.client.js"

export function CategoriesRepository() {
    const createAutomatic = async () => {
        const categories = [
            { name: 'audio' },
            { name: 'video' },
            { name: 'imagem' },
            { name: 'pdf' },
            { name: 'compacto' },
        ]
        for (const category of categories) {
            await prisma.category.upsert({
                where: { name: category.name },
                update: {},
                create: category,
            })
        }
    }

    const findAll = async () => {
        const result = await prisma.category.findMany()

        return result
    }

    return {createAutomatic, findAll}
}