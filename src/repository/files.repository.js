import { prisma } from "../database/prisma.client.js";
import { categoryRename } from "../utils/category.rename.js";


export function FilesRepository() {
    const create = async ( file) => {
        const categoryName = categoryRename(file.mimetype)

        if (!categoryName) {
            return null
        }

        const category = await prisma.category.findFirst({
            where: {
                name: categoryName
            }
        })

        if (category) {
            const result = await prisma.file.create({
                data: {
                    name: file.filename,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: (file.size / 1024),
                    categoryId: category.id
                }
            })
    
            return result
        }

        return null
    }

    const findAll = async ( categoryId ) => {
        const result = await prisma.file.findMany({
            where: {
                categoryId: categoryId
            }
        })

        return result;
    }

    return { create, findAll }
}

