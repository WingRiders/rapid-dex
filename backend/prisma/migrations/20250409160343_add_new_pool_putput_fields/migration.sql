-- CreateEnum
CREATE TYPE "PoolInteractionType" AS ENUM ('Create', 'Swap', 'AddLiquidity', 'WithdrawLiquidity', 'Donate');

-- AlterTable
ALTER TABLE "PoolOutput" ADD COLUMN     "createdByStakeKeyHash" TEXT,
ADD COLUMN     "interactionType" "PoolInteractionType" NOT NULL,
ADD COLUMN     "lptsDiff" BIGINT NOT NULL,
ADD COLUMN     "qtyADiff" BIGINT NOT NULL,
ADD COLUMN     "qtyBDiff" BIGINT NOT NULL;
