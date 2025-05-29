-- AlterTable
ALTER TABLE "PoolOutput" ADD COLUMN     "outputVolumeA" BIGINT NOT NULL,
ADD COLUMN     "outputVolumeB" BIGINT NOT NULL,
ADD COLUMN     "volumeA" BIGINT NOT NULL,
ADD COLUMN     "volumeB" BIGINT NOT NULL;
