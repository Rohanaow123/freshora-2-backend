/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders` ADD COLUMN `orderId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `orders_orderId_key` ON `orders`(`orderId`);
