async function resetSequences(client) {
  try {
    const { rows } = await client.query(`
      SELECT c.relname AS sequence_name, t.relname AS table_name
      FROM pg_class c
      JOIN pg_depend d ON d.objid = c.oid
      JOIN pg_class t ON t.oid = d.refobjid
      WHERE c.relkind = 'S' AND t.relkind = 'r'
    `);

    for (const row of rows) {
      const { sequence_name, table_name } = row;
      
      const pkRes = await client.query(`
        SELECT a.attname AS column_name
        FROM pg_index i
        JOIN pg_attribute a ON i.indexrelid = a.attrelid
        WHERE i.indrelid = '${table_name}'::regclass
        AND i.indisprimary
      `);

      const pkColumn = pkRes.rows[0]?.column_name || 'id';
      
      const res = await client.query(`SELECT MAX(${pkColumn}) AS maxid FROM ${table_name}`);
      const nextIdValue = (res.rows[0].maxid || 0) + 1;

      await client.query(`ALTER SEQUENCE ${sequence_name} RESTART WITH ${nextIdValue}`);
      console.log(`Reset sequence ${sequence_name} for table ${table_name} to ${nextIdValue}`);
    }

    console.log('All sequences reset successfully');
  } catch (error) {
    console.error('Error resetting sequences:', error);
    throw error;
  }
}

module.exports = { resetSequences };
