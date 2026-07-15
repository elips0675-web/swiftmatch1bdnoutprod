# Database Migrations

## Usage

```bash
node database/migrations/migrate.js
```

This applies all `.sql` files in numerical order that haven't been applied yet.
Migration tracking is stored in the `_migrations` table.

## Adding a new migration

1. Create a new file like `003_add_some_column.sql`
2. Run `node database/migrations/migrate.js` to apply it
