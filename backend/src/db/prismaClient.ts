import {Prisma, PrismaClient} from '@prisma/client'

export * from '@prisma/client'

export const prisma = new PrismaClient()

// Prisma by default handles array of Uint8Arrays as jsonb[], so this workaround is needed
export const toByteaArray = (buffers: Uint8Array[]) =>
  Prisma.sql`array[${Prisma.join(buffers)}]::bytea[]`
