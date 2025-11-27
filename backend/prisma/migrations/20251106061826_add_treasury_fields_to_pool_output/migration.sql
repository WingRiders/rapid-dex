/*
  Warnings:

  - Added the required column `treasuryA` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasuryADiff` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasuryAuthorityName` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasuryAuthorityPolicy` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasuryB` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasuryBDiff` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasuryFeePointsAToB` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treasuryFeePointsBToA` to the `PoolOutput` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PoolInteractionType" ADD VALUE 'WithdrawTreasury';

-- AlterTable
ALTER TABLE "PoolOutput" ADD COLUMN     "treasuryA" BIGINT NOT NULL,
ADD COLUMN     "treasuryADiff" BIGINT NOT NULL,
ADD COLUMN     "treasuryAuthorityName" TEXT NOT NULL,
ADD COLUMN     "treasuryAuthorityPolicy" TEXT NOT NULL,
ADD COLUMN     "treasuryB" BIGINT NOT NULL,
ADD COLUMN     "treasuryBDiff" BIGINT NOT NULL,
ADD COLUMN     "treasuryFeePointsAToB" INTEGER NOT NULL,
ADD COLUMN     "treasuryFeePointsBToA" INTEGER NOT NULL;
