# MySQL to PostgreSQL Migrator

A Node.js package to easily migrate data from MySQL to PostgreSQL databases.

## Features

- Migrate entire databases or specific tables
- Automatic data type mapping
- Support for primary keys, foreign keys, and indexes
- Handles NULL values and defaults
- Batch processing for large tables
- Sequence reset functionality
- Detailed migration status reporting

## Installation

```bash
npm install mysql-to-postgres-migrator
```

## Usage

```javascript
const { migrateData } = require('mysql-to-postgres-migrator');

const config = {
  mysql: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'source_db'
  },
  postgres: {
    host: 'localhost',
    user: 'postgres',
    password: 'password',
    database: 'target_db',
    port: 5432
  },
  options: {
    tables: [], // Empty array means migrate all tables
    primary: true,
    notNull: true,
    default: true,
    resetSequences: true,
    batchSize: 1000
  }
};

async function migrate() {
  try {
    const result = await migrateData(config);
    console.log('Migration completed:', result);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
```

## Configuration Options

### MySQL Configuration
- `host`: MySQL host address
- `user`: MySQL username
- `password`: MySQL password
- `database`: Source database name

### PostgreSQL Configuration
- `host`: PostgreSQL host address
- `user`: PostgreSQL username
- `password`: PostgreSQL password
- `database`: Target database name
- `port`: PostgreSQL port (default: 5432)

### Migration Options
- `tables`: Array of table names to migrate (empty array for all tables)
- `primary`: Include primary key constraints (default: true)
- `notNull`: Include NOT NULL constraints (default: true)
- `default`: Include DEFAULT values (default: true)
- `resetSequences`: Reset sequences after migration (default: true)
- `batchSize`: Number of rows to insert in each batch (default: 1000)

## Response Object

The migration function returns an object with:
- `success`: Array of successfully migrated tables
- `failed`: Array of failed tables
- `empty`: Array of empty tables
- `details`: Object with detailed information about each table's migration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.