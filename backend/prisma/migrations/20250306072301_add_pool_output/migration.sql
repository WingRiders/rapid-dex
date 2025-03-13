-- CreateEnum
CREATE TYPE "ScriptVersion" AS ENUM ('V1', 'V2', 'V3');

-- CreateTable
CREATE TABLE "PoolOutput" (
    "utxoId" TEXT NOT NULL,
    "spendUtxoId" TEXT,
    "slot" INTEGER NOT NULL,
    "spendSlot" INTEGER,
    "shareAssetName" TEXT NOT NULL,
    "assetAPolicy" TEXT NOT NULL,
    "assetAName" TEXT NOT NULL,
    "assetBPolicy" TEXT NOT NULL,
    "assetBName" TEXT NOT NULL,
    "lpts" BIGINT NOT NULL,
    "qtyA" BIGINT NOT NULL,
    "qtyB" BIGINT NOT NULL,
    "assets" JSONB NOT NULL,
    "coins" BIGINT NOT NULL,
    "datumCBOR" TEXT NOT NULL,
    "txMetadata" JSONB,
    "scriptCBOR" TEXT,
    "scriptVersion" "ScriptVersion",

    CONSTRAINT "PoolOutput_pkey" PRIMARY KEY ("utxoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoolOutput_spendUtxoId_key" ON "PoolOutput"("spendUtxoId");

-- CreateIndex
CREATE INDEX "PoolOutput_slot_idx" ON "PoolOutput"("slot");

-- CreateIndex
CREATE INDEX "PoolOutput_spendSlot_idx" ON "PoolOutput"("spendSlot");

-- AddForeignKey
ALTER TABLE "PoolOutput" ADD CONSTRAINT "PoolOutput_slot_fkey" FOREIGN KEY ("slot") REFERENCES "Block"("slot") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolOutput" ADD CONSTRAINT "PoolOutput_spendSlot_fkey" FOREIGN KEY ("spendSlot") REFERENCES "Block"("slot") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolOutput" ADD CONSTRAINT "PoolOutput_spendUtxoId_fkey" FOREIGN KEY ("spendUtxoId") REFERENCES "PoolOutput"("utxoId") ON DELETE SET NULL ON UPDATE CASCADE;
