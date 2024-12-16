-> npm install

-> npx prisma init --datasource-provider sqlite

//cole os models em prisma/schema.prisma:

model File {
  id         String   @id @default(uuid())
  name       String
  filename   String
  mimetype   String
  size       Decimal
  uploadDate DateTime @default(now())
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])

  @@map("files")
}

model Category {
  id    String @id @default(uuid())
  name  String @unique
  files File[]

  @@map("categories")
}


-> npx prisma migrate dev
//de um nome, exemplo: init


