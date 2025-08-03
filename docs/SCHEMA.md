# Database Schema (Drizzle ORM)

This document outlines the database schema for Home Hub, defined using Drizzle ORM. All tables are scoped by `household_id` to ensure multi-tenancy.

## Tables

### `users`

Stores user information.

| Column     | Type     | Description                               |
| :--------- | :------- | :---------------------------------------- |
| `id`       | `uuid`   | Primary key, unique user identifier       |
| `email`    | `varchar`| User's email address (unique)             |
| `name`     | `varchar`| User's display name                       |
| `created_at`| `timestamp`| Timestamp of user creation                |

### `households`

Stores household information.

| Column     | Type     | Description                               |
| :--------- | :------- | :---------------------------------------- |
| `id`       | `uuid`   | Primary key, unique household identifier  |
| `name`     | `varchar`| Household name                            |
| `created_by`| `uuid`   | ID of the user who created the household  |
| `created_at`| `timestamp`| Timestamp of household creation           |

### `household_members`

Links users to households and defines their roles.

| Column       | Type     | Description                               |
| :----------- | :------- | :---------------------------------------- |
| `id`         | `uuid`   | Primary key                               |
| `household_id`| `uuid`   | Foreign key to `households` table         |
| `user_id`    | `uuid`   | Foreign key to `users` table              |
| `role`       | `varchar`| User's role within the household (`owner` or `member`) |
| `joined_at`  | `timestamp`| Timestamp when user joined the household  |

### `categories`

Defines categories for groceries and expenses.

| Column       | Type     | Description                               |
| :----------- | :------- | :---------------------------------------- |
| `id`         | `uuid`   | Primary key                               |
| `household_id`| `uuid`   | Foreign key to `households` table         |
| `name`       | `varchar`| Category name                             |
| `type`       | `varchar`| Category type (`grocery` or `expense`)    |
| `created_by` | `uuid`   | ID of the user who created the category   |

### `items` (catalog)

Stores a catalog of items that can be tracked in inventory or purchased.

| Column            | Type     | Description                               |
| :---------------- | :------- | :---------------------------------------- |
| `id`              | `uuid`   | Primary key                               |
| `household_id`    | `uuid`   | Foreign key to `households` table         |
| `name`            | `varchar`| Item name                                 |
| `default_unit`    | `varchar`| Default unit of measurement for the item  |
| `default_category_id`| `uuid`   | Foreign key to `categories` table (optional) |
| `perishable`      | `boolean`| Indicates if the item is perishable       |

### `inventory`

Tracks specific instances of items in a household's inventory.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `item_id`      | `uuid`   | Foreign key to `items` table              |
| `quantity`     | `integer`| Current quantity of the item              |
| `unit`         | `varchar`| Unit of measurement for this inventory item |
| `storage`      | `varchar`| Storage location (`pantry`, `fridge`, `freezer`, `other`) |
| `purchase_date`| `timestamp`| Date the item was purchased               |
| `expiry_date`  | `timestamp`| Expiry date of the item                   |
| `cost_total`   | `decimal`| Total cost of this inventory item         |
| `notes`        | `text`   | Additional notes                          |
| `created_by`   | `uuid`   | ID of the user who added the item         |
| `updated_by`   | `uuid`   | ID of the user who last updated the item  |
| `created_at`   | `timestamp`| Timestamp of creation                     |
| `updated_at`   | `timestamp`| Timestamp of last update                  |

### `purchases`

Records household purchases.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `vendor`       | `varchar`| Vendor name                               |
| `purchase_date`| `timestamp`| Date of the purchase                      |
| `total_amount` | `decimal`| Total amount of the purchase              |
| `paid_by_user_id`| `uuid`   | ID of the user who paid for the purchase  |
| `notes`        | `text`   | Additional notes                          |
| `created_by`   | `uuid`   | ID of the user who recorded the purchase  |
| `created_at`   | `timestamp`| Timestamp of creation                     |

### `purchase_items`

Details of items within a purchase.

| Column       | Type     | Description                               |
| :----------- | :------- | :---------------------------------------- |
| `id`         | `uuid`   | Primary key                               |
| `purchase_id`| `uuid`   | Foreign key to `purchases` table          |
| `item_id`    | `uuid`   | Foreign key to `items` table              |
| `quantity`   | `integer`| Quantity of the item purchased            |
| `unit`       | `varchar`| Unit of measurement for this purchase item |
| `line_total` | `decimal`| Total cost of this line item              |

### `bills`

Tracks household bills.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `name`         | `varchar`| Bill name                                 |
| `vendor`       | `varchar`| Bill vendor                               |
| `amount`       | `decimal`| Bill amount                               |
| `due_date`     | `timestamp`| Due date of the bill                      |
| `status`       | `varchar`| Bill status (`pending`, `paid`, `overdue`)|
| `recurring_rule`| `varchar`| RRULE string for recurring bills (optional) |
| `category_id`  | `uuid`   | Foreign key to `categories` table (optional) |
| `notes`        | `text`   | Additional notes                          |
| `created_by`   | `uuid`   | ID of the user who created the bill       |
| `created_at`   | `timestamp`| Timestamp of creation                     |

### `bill_payments`

Records payments made for bills.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `bill_id`      | `uuid`   | Foreign key to `bills` table              |
| `paid_on`      | `timestamp`| Date the bill was paid                    |
| `amount`       | `decimal`| Amount paid                               |
| `paid_by_user_id`| `uuid`   | ID of the user who paid the bill          |
| `method`       | `varchar`| Payment method                            |
| `notes`        | `text`   | Additional notes                          |

### `budgets`

Sets monthly budget limits for a household.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `period`       | `varchar`| Budget period (YYYY-MM format)            |
| `limit_amount` | `decimal`| Monthly budget limit                      |

### `expenses`

Records individual expenses, derived from purchases, bills, or other sources.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `date`         | `timestamp`| Date of the expense                       |
| `amount`       | `decimal`| Expense amount                            |
| `category_id`  | `uuid`   | Foreign key to `categories` table (optional) |
| `description`  | `text`   | Expense description                       |
| `source`       | `varchar`| Source of the expense (`purchase`, `bill`, `other`) |
| `linked_entity_id`| `uuid`   | ID of the linked entity (e.g., `purchase_id`, `bill_id`) |

### `waste_events`

Tracks discarded or wasted inventory items.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `inventory_id` | `uuid`   | Foreign key to `inventory` table          |
| `item_id`      | `uuid`   | Foreign key to `items` table              |
| `quantity`     | `integer`| Quantity of item wasted                   |
| `unit`         | `varchar`| Unit of measurement for wasted item       |
| `reason`       | `varchar`| Reason for waste (`expired`, `spoiled`, `leftover`, `other`) |
| `event_date`   | `timestamp`| Date of the waste event                   |

### `shopping_list`

Collaborative shopping list items.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `item_name`    | `varchar`| Name of the item on the shopping list     |
| `added_by_user_id`| `uuid`   | ID of the user who added the item         |
| `created_at`   | `timestamp`| Timestamp of creation                     |
| `purchased_at` | `timestamp`| Timestamp when the item was purchased (nullable) |

### `audit_logs`

Records changes to entities for auditing purposes.

| Column         | Type     | Description                               |
| :------------- | :------- | :---------------------------------------- |
| `id`           | `uuid`   | Primary key                               |
| `household_id` | `uuid`   | Foreign key to `households` table         |
| `user_id`      | `uuid`   | ID of the user who performed the action   |
| `entity_table` | `varchar`| Name of the table affected                |
| `entity_id`    | `uuid`   | ID of the affected entity                 |
| `action`       | `varchar`| Type of action (`create`, `update`, `delete`) |
| `diff_json`    | `jsonb`  | JSON representation of the changes        |
| `created_at`   | `timestamp`| Timestamp of the audit log entry          |
