/*
  Warnings:

  - You are about to drop the column `swapFeePoints` on the `PoolOutput` table. All the data in the column will be lost.
  - Added the required column `feeFrom` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `swapFeePointsAToB` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `swapFeePointsBToA` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeeFrom" AS ENUM ('InputToken', 'OutputToken', 'TokenA', 'TokenB');

-- New contracts mean we no longer aggregate pools on the old contract. Wiping out the data allows creating required columns
TRUNCATE TABLE "Block" CASCADE;

-- AlterTable
ALTER TABLE "PoolOutput" DROP COLUMN "swapFeePoints",
ADD COLUMN     "feeFrom" "FeeFrom" NOT NULL,
ADD COLUMN     "swapFeePointsAToB" INTEGER NOT NULL,
ADD COLUMN     "swapFeePointsBToA" INTEGER NOT NULL;
