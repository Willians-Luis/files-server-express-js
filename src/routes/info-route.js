import { Router } from 'express';


const infoRoute = Router();

infoRoute.get('/', async (req, res) => {
    try {
        const info = {
            types: {
                FolderType: {
                    id: "string",
                    isPublic: "string",
                    name: "string"
                },
                FileType: {
                    id: "string",
                    name: "string",
                    filename: "string",
                    mimetype: "string",
                    size: "number",
                    folderId: "string",
                }
            },
            folderRoute: {
                create: {
                    method: "POST",
                    url: "http://{my_ip}:3333/folder",
                    body: "{name: string}",
                },
                getAll: {
                    method: "GET",
                    url: "http://{my_ip}:3333/folder/isPublic/{isPublic: boolean}",
                },
                getById: {
                    method: "GET",
                    url: "http://{my_ip}:3333/folder/{id}",
                },
                update: {
                    method: "PUT",
                    url: "http://{my_ip}:3333/folder/{id}",
                    body: "{name: string}",
                },
                delete: {
                    method: "DELETE",
                    url: "http://{my_ip}:3333/folder/{id}",
                },
            },
            fileRoute: {
                upload: {
                    method: "POST",
                    headers: "{'Content-Type': 'multipart/from-data'}",
                    url: "http://{my_ip}:3333/file/upload/folder/{folder_id}",
                    body: "file",
                },
                getAllByFolderId: {
                    method: "GET",
                    url: "http://{my_ip}:3333/file/folder/{folder_id}",
                },
                getById: {
                    method: "GET",
                    url: "http://{my_ip}:3333/file/{id}",
                },
                update: {
                    method: "PUT",
                    url: "http://{my_ip}:3333/file/{id}",
                    body: "{name: string}",
                },
                delete: {
                    method: "DELETE",
                    url: "http://{my_ip}:3333/file/{filename}",
                },
                download: {
                    method: "GET",
                    url: "http://{my_ip}:3333/file/download/{filename}",
                },
                stream: {
                    method: "GET",
                    url: "http://{my_ip}:3333/file/stream/{filename}",
                },
            }
        }
        res.status(200).json(info)
    } catch (error) {
        res.status(404).send()
    }
})

export default infoRoute;
