/*
  Warnings:

  - You are about to drop the column `image` on the `service_items` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `service_items` DROP COLUMN `image`;

-- AlterTable
ALTER TABLE `services` DROP COLUMN `image`;
