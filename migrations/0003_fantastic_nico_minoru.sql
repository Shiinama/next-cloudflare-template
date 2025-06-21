CREATE TABLE `userUsage` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`usedTokens` integer DEFAULT 0 NOT NULL,
	`totalTokens` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
