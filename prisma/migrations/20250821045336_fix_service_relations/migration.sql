-- AlterTable
ALTER TABLE `orders` MODIFY `customerAddress` VARCHAR(191) NULL,
    MODIFY `notes` VARCHAR(191) NULL,
    MODIFY `specialInstructions` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `services` MODIFY `fullDescription` VARCHAR(191) NOT NULL;
