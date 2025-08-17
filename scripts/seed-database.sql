-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS laundry_service;
USE laundry_service;

-- Note: Run `npx prisma migrate dev --name init` after creating this schema
-- This will create all the tables based on the Prisma schema

-- The following is just for reference - Prisma will handle table creation
-- But you can use this as a reference for the expected structure

/*
Expected tables after Prisma migration:
- services
- service_items  
- orders
- order_items
- carts
- cart_items
*/
