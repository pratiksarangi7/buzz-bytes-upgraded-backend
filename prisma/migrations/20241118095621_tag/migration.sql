/*
  Warnings:

  - Added the required column `tag` to the `Tweet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Tag" AS ENUM ('FFCS', 'CABSHARING', 'LOST_AND_FOUND', 'CAREER', 'EVENTS', 'EXAM_DISCUSSIONS');

-- AlterTable
ALTER TABLE "Tweet" ADD COLUMN     "tag" "Tag" NOT NULL;
