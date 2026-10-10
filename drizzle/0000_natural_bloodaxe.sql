CREATE TABLE `agency` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`legal_name` text,
	`cif` text,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`province` text,
	`postal_code` text,
	`lat` real,
	`lng` real,
	`logo_path` text,
	`primary_color` text DEFAULT '#2563eb' NOT NULL,
	`accent_color` text DEFAULT '#f59e0b' NOT NULL,
	`facebook` text,
	`instagram` text,
	`linkedin` text,
	`x` text,
	`website_title` text,
	`website_tagline` text,
	`about_text` text,
	`show_cheapest` integer DEFAULT true NOT NULL,
	`default_vat` real DEFAULT 21 NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `client_preferences` (
	`client_id` integer PRIMARY KEY NOT NULL,
	`operation` text,
	`types` text DEFAULT '[]' NOT NULL,
	`min_price` integer,
	`max_price` integer,
	`min_rooms` integer,
	`min_baths` integer,
	`min_area` integer,
	`zones` text DEFAULT '[]' NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `client_property_interest` (
	`client_id` integer NOT NULL,
	`property_id` integer NOT NULL,
	`status` text DEFAULT 'propuesta' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`client_id`, `property_id`),
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`surname` text,
	`email` text,
	`phone` text,
	`phone2` text,
	`dni` text,
	`address` text,
	`kind` text DEFAULT 'comprador' NOT NULL,
	`source` text DEFAULT 'oficina' NOT NULL,
	`status` text DEFAULT 'nuevo' NOT NULL,
	`agent_id` integer,
	`notes` text,
	`gdpr_consent` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `clients_agent_idx` ON `clients` (`agent_id`);--> statement-breakpoint
CREATE INDEX `clients_kind_idx` ON `clients` (`kind`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer,
	`subject` text NOT NULL,
	`channel` text DEFAULT 'web' NOT NULL,
	`property_id` integer,
	`agent_id` integer,
	`last_message_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text DEFAULT 'reunion' NOT NULL,
	`title` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`all_day` integer DEFAULT false NOT NULL,
	`location` text,
	`details` text,
	`client_id` integer,
	`property_id` integer,
	`agent_id` integer,
	`reminder_minutes` integer,
	`notify_all` integer DEFAULT false NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `events_start_idx` ON `events` (`starts_at`);--> statement-breakpoint
CREATE INDEX `events_agent_idx` ON `events` (`agent_id`);--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`concept` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price_cents` integer DEFAULT 0 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`next_number` integer DEFAULT 1 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_series_code_unique` ON `invoice_series` (`code`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`series_id` integer NOT NULL,
	`number` text,
	`issue_date` integer NOT NULL,
	`due_date` integer,
	`client_id` integer,
	`customer_name` text NOT NULL,
	`customer_nif` text,
	`customer_address` text,
	`property_id` integer,
	`agent_id` integer,
	`status` text DEFAULT 'borrador' NOT NULL,
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`vat_rate` real DEFAULT 21 NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`paid_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `invoice_series`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `inv_date_idx` ON `invoices` (`issue_date`,`status`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`city` text,
	`zone` text,
	`type` text,
	`operation` text,
	`expected_price` integer,
	`stage` text DEFAULT 'nuevo' NOT NULL,
	`agent_id` integer,
	`property_id` integer,
	`notes` text,
	`captured_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `leads_stage_idx` ON `leads` (`stage`,`agent_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`direction` text DEFAULT 'entrante' NOT NULL,
	`author_user_id` integer,
	`body` text NOT NULL,
	`sender_name` text,
	`sender_email` text,
	`sender_phone` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `messages_read_idx` ON `messages` (`read_at`);--> statement-breakpoint
CREATE TABLE `portals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`feed_token` text NOT NULL,
	`last_generated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portals_key_unique` ON `portals` (`key`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref` text NOT NULL,
	`title` text NOT NULL,
	`operation` text DEFAULT 'venta' NOT NULL,
	`type` text DEFAULT 'piso' NOT NULL,
	`status` text DEFAULT 'disponible' NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`community_fee` integer,
	`area_built` integer,
	`area_useful` integer,
	`plot_area` integer,
	`rooms` integer,
	`baths` integer,
	`floor` text,
	`year_built` integer,
	`energy_rating` text,
	`condition` text DEFAULT 'buen_estado' NOT NULL,
	`address` text,
	`city` text,
	`zone` text,
	`province` text,
	`postal_code` text,
	`lat` real,
	`lng` real,
	`show_exact_location` integer DEFAULT false NOT NULL,
	`description` text,
	`description_en` text,
	`features` text DEFAULT '[]' NOT NULL,
	`agent_id` integer,
	`owner_client_id` integer,
	`lead_id` integer,
	`is_shared` integer DEFAULT false NOT NULL,
	`shared_commission_pct` real,
	`commission_pct` real DEFAULT 3 NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published_web` integer DEFAULT true NOT NULL,
	`closed_at` integer,
	`closed_price` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `properties_ref_unique` ON `properties` (`ref`);--> statement-breakpoint
CREATE INDEX `prop_filters_idx` ON `properties` (`status`,`operation`,`type`,`city`);--> statement-breakpoint
CREATE INDEX `prop_agent_idx` ON `properties` (`agent_id`);--> statement-breakpoint
CREATE TABLE `property_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`property_id` integer NOT NULL,
	`path` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `property_portals` (
	`property_id` integer NOT NULL,
	`portal_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`property_id`, `portal_id`),
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`portal_id`) REFERENCES `portals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_at` integer,
	`priority` text DEFAULT 'media' NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`done_at` integer,
	`agent_id` integer,
	`client_id` integer,
	`property_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tasks_due_idx` ON `tasks` (`due_at`,`agent_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'agente' NOT NULL,
	`phone` text,
	`avatar_path` text,
	`color` text DEFAULT '#2563eb' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `valuations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`property_id` integer,
	`owner_name` text,
	`address` text,
	`city` text,
	`zone` text,
	`type` text NOT NULL,
	`operation` text NOT NULL,
	`area` integer NOT NULL,
	`rooms` integer,
	`baths` integer,
	`condition` text DEFAULT 'buen_estado' NOT NULL,
	`comparable_ids` text DEFAULT '[]' NOT NULL,
	`price_per_m2_median` real,
	`estimated_low` integer,
	`estimated` integer,
	`estimated_high` integer,
	`agent_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `visit_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`property_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`agent_id` integer,
	`event_id` integer,
	`visited_at` integer NOT NULL,
	`rating` integer,
	`feedback` text,
	`interest_level` text DEFAULT 'medio' NOT NULL,
	`offer_amount` integer,
	`signature_png` text,
	`client_dni` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null
);
