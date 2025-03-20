/*
  Warnings:

  - Added the required column `address` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PoolOutput" ADD COLUMN     "address" TEXT NOT NULL;
