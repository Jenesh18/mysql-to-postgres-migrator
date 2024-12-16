const { migrateData } = require('../src/index');


async function runMigration() {
  const config = {
    mysql: {
      host: 'dev-scratchie-rds.cdongwdsm2fk.us-east-2.rds.amazonaws.com',
      user: 'scratchieadmin',
      password: 'ap7n13cuFYcfjR2mi4pm',
      database: 'test',
    },
    postgres: {
      host: 'localhost',
      user: 'postgres',
      password: '1234',
      database: 'npm_testing',
      port: 5432,
    },
    options: {
      tables: [], 
      primary: true,
      notNull: true,
      default: true,
      resetSequences: true,
      batchSize: 1000
    }
  };

  try {
    const result = await migrateData(config);
    console.log('Migration completed successfully');
    console.log('Successful migrations:', result.success);
    console.log('Failed migrations:', result.failed);
    console.log('Empty tables:', result.empty);
    console.log('Details:', result.details);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();