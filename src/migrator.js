const mysql = require('mysql2');
const { Client } = require('pg');
const { mapDataType } = require('./utils/dataTypeMapper');
const { resetSequences } = require('./utils/sequenceResetter');

async function migrateData(options) {
  // Validate required options
  if (!options?.mysql || !options?.postgres) {
    throw new Error('Missing database configuration. Required: mysql and postgres configurations');
  }

  const mysqlConnection = mysql.createConnection({
    host: options.mysql.host,
    user: options.mysql.user,
    password: options.mysql.password,
    database: options.mysql.database,
  }).promise(); // Use promise interface

  const postgresClient = new Client({
    host: options.postgres.host,
    user: options.postgres.user,
    password: options.postgres.password,
    database: options.postgres.database,
    port: options.postgres.port || 5432,
  });

  const migrationOptions = {
    tables: options.options?.tables || [],
    primary: options.options?.primary ?? true,
    notNull: options.options?.notNull ?? true,
    default: options.options?.default ?? true,
    resetSequences: options.options?.resetSequences ?? true,
    batchSize: options.options?.batchSize || 1000
  };

  const migrationStatus = {
    success: [],
    failed: [],
    empty: [],
    details: {}
  };

  try {
    // Connect to both databases
    await Promise.all([
      mysqlConnection.connect(),
      postgresClient.connect()
    ]);

    // Get tables to migrate
    const [tables] = await mysqlConnection.query('SHOW TABLES');
    const tablesToMigrate = migrationOptions.tables.length > 0 
      ? tables.filter(t => migrationOptions.tables.includes(Object.values(t)[0]))
      : tables;
    
    for (const tableRow of tablesToMigrate) {
      const tableName = Object.values(tableRow)[0];
      migrationStatus.details[tableName] = { startTime: new Date() };
      
      try {
        console.log(`Starting migration for table: ${tableName}`);
        
        // Get table schema
        const [columns] = await mysqlConnection.query(`DESCRIBE ${tableName}`);
        
        // Drop existing table if it exists
        await postgresClient.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        
        // Create table definition
        const columnDefinitions = columns.map(col => {
          const isAutoIncrement = col.Extra.includes('auto_increment');
          const isPrimaryKey = col.Key === 'PRI' && migrationOptions.primary;
          let definition = `${col.Field} ${mapDataType(col.Type, col.Field, isAutoIncrement, isPrimaryKey)}`;
          
          // if (migrationOptions.notNull && col.Null === 'NO') {
          //   definition += ' NOT NULL';
          // }

          // if (migrationOptions.default && col.Default !== null && col.Default !== '') {
          //   definition += ` DEFAULT ${col.Default}`;
          // }
          
          return definition;
        }).join(', ');

        // Create table
        console.log(`Creating table: ${columnDefinitions}`);
        await postgresClient.query(`CREATE TABLE ${tableName} (${columnDefinitions})`);
        console.log(`Created table structure for: ${tableName}`);

        // Migrate data
        const [rows] = await mysqlConnection.query(`SELECT * FROM ${tableName}`);
        
        if (rows.length === 0) {
          migrationStatus.empty.push(tableName);
          console.log(`Table ${tableName} is empty`);
          continue;
        }

        // Insert data in batches
        for (let i = 0; i < rows.length; i += migrationOptions.batchSize) {
          const batch = rows.slice(i, i + migrationOptions.batchSize);
          const columns = Object.keys(batch[0]).map(col => `${col}`).join(', ');
          
          const values = batch.map(row => {
            const rowValues = Object.values(row).map(val => {
              if (val === null) return 'NULL';
              
              if (val instanceof Date) {
                // More robust date handling
                try {
                  // Check if date is valid
                  if (isNaN(val.getTime())) {
                    return 'NULL';
                  }
                  return `'${val.toISOString()}'`;
                } catch (err) {
                  console.warn(`Invalid date value found, replacing with NULL`);
                  return 'NULL';
                }
              }
              
              // Handle string values
              const strVal = val.toString();
              // Remove any invalid characters that might cause PostgreSQL message format errors
              const cleanVal = strVal.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
              return `'${cleanVal.replace(/'/g, "''")}'`;
            });
            return `(${rowValues.join(', ')})`;
          }).join(', ');

          const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES ${values}`;
          console.log(`${insertQuery}`);
          await postgresClient.query(insertQuery);
        }

        migrationStatus.success.push(tableName);
        migrationStatus.details[tableName].endTime = new Date();
        migrationStatus.details[tableName].rowCount = rows.length;
        console.log(`Successfully migrated table: ${tableName}`);

      } catch (error) {
        migrationStatus.failed.push(tableName);
        migrationStatus.details[tableName].error = error.message;
        migrationStatus.details[tableName].endTime = new Date();
        console.error(`Failed to migrate table ${tableName}:`, error);
      }
    }

    // Reset sequences if option is enabled
    if (migrationOptions.resetSequences) {
      console.log('Resetting sequences...');
      await resetSequences(postgresClient);
    }

    return migrationStatus;

  } catch (error) {
    throw new Error(`Migration failed: ${error.message}`);
  } finally {
    // Close connections
    await Promise.all([
      mysqlConnection.end(),
      postgresClient.end()
    ]);
  }
}

module.exports = { migrateData };
