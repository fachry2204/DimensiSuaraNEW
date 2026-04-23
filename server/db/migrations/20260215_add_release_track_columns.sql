-- Migration: Add optional columns and tables for releases/tracks metadata
-- Target: MySQL 8.x / MariaDB 10.4+ (supports IF NOT EXISTS)

-- Releases table optional columns
ALTER TABLE `releases`
  ADD COLUMN IF NOT EXISTS `original_release_date` DATE NULL AFTER `language`,
  ADD COLUMN IF NOT EXISTS `planned_release_date` DATE NULL AFTER `original_release_date`,
  ADD COLUMN IF NOT EXISTS `distribution_targets` JSON NULL AFTER `upc`,
  ADD COLUMN IF NOT EXISTS `aggregator` VARCHAR(100) NULL AFTER `distribution_targets`;

-- Fallback for servers without native JSON (uncomment if needed)
-- ALTER TABLE `releases`
--   ADD COLUMN IF NOT EXISTS `distribution_targets` TEXT NULL AFTER `upc`;

-- Tracks table optional columns
ALTER TABLE `tracks`
  ADD COLUMN IF NOT EXISTS `audio_clip` VARCHAR(512) NULL AFTER `audio_file`,
  ADD COLUMN IF NOT EXISTS `lyrics` MEDIUMTEXT NULL AFTER `lyricist`,
  ADD COLUMN IF NOT EXISTS `ipl_file` VARCHAR(512) NULL AFTER `lyrics`,
  ADD COLUMN IF NOT EXISTS `is_instrumental` TINYINT(1) NULL DEFAULT 0 AFTER `ipl_file`;

-- Track contributors table
CREATE TABLE IF NOT EXISTS `track_contributors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `track_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NULL,
  `role` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_track_contributors_track_id` (`track_id`),
  CONSTRAINT `fk_track_contributors_track`
    FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill helper: ensure is_instrumental has default 0
UPDATE `tracks` SET `is_instrumental` = 0 WHERE `is_instrumental` IS NULL;

-- Notes:
-- - If your MySQL version doesn't support ADD COLUMN IF NOT EXISTS, run conditional checks or remove IF NOT EXISTS.
-- - If JSON type is unsupported, use the TEXT fallback above for `distribution_targets`.
