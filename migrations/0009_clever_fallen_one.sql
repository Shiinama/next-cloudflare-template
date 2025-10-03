-- Backfill non-default locale posts into translation table before dropping column
INSERT INTO `postTranslations` (
  `id`,
  `postId`,
  `slug`,
  `title`,
  `excerpt`,
  `cover_image_url`,
  `locale`,
  `content`,
  `created_at`,
  `updated_at`
)
SELECT
  lower(hex(randomblob(16))),
  p.`id`,
  p.`slug`,
  p.`title`,
  p.`excerpt`,
  p.`cover_image_url`,
  p.`locale`,
  p.`content`,
  COALESCE(p.`created_at`, CAST(strftime('%s','now') AS INTEGER) * 1000),
  COALESCE(p.`updated_at`, CAST(strftime('%s','now') AS INTEGER) * 1000)
FROM `posts` p
WHERE p.`locale` IS NOT NULL
  AND p.`locale` <> 'en'
  AND NOT EXISTS (
    SELECT 1
    FROM `postTranslations` pt
    WHERE pt.`postId` = p.`id`
      AND pt.`locale` = p.`locale`
  );

PRAGMA foreign_keys=off;

CREATE TABLE `__new_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `title` text NOT NULL,
  `cover_image_url` text,
  `excerpt` text NOT NULL,
  `content` text NOT NULL,
  `published_at` integer,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO `__new_posts` (
  `id`,
  `slug`,
  `title`,
  `cover_image_url`,
  `excerpt`,
  `content`,
  `published_at`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  `slug`,
  `title`,
  `cover_image_url`,
  `excerpt`,
  `content`,
  `published_at`,
  `created_at`,
  `updated_at`
FROM `posts`;

DROP TABLE `posts`;
ALTER TABLE `__new_posts` RENAME TO `posts`;

CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);

PRAGMA foreign_keys=on;
