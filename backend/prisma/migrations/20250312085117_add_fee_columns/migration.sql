-- We need to reset DB when adding NOT NULL columns
TRUNCATE TABLE "Block" RESTART IDENTITY CASCADE;

ALTER TABLE "PoolOutput"
    ADD COLUMN "feeBasis" INTEGER NOT NULL,
    ADD COLUMN "swapFeePoints" INTEGER NOT NULL;
