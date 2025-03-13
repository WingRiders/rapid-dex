-- CreateTable
CREATE TABLE "Block" (
    "slot" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "hash" VARCHAR(64) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("slot")
);
