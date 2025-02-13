-- CreateTable
CREATE TABLE "folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" DECIMAL NOT NULL,
    "folderId" TEXT NOT NULL,
    CONSTRAINT "file_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
