function mapDataType(mysqlType, field, isAutoIncrement, isPrimaryKey) {
  const type = mysqlType.toLowerCase();

  if (isAutoIncrement) {
    return `SERIAL${isPrimaryKey ? ' PRIMARY KEY' : ''}`;
  }

  const lengthMatch = type.match(/\((\d+)(?:,(\d+))?\)/);
  const length = lengthMatch ? lengthMatch[1] : null;
  const precision = lengthMatch ? lengthMatch[2] : null;

  if (type.includes('varchar')) return `VARCHAR(${length || '255'})`;
  if (type.includes('char')) return `CHAR(${length || '1'})`;
  if (type.includes('longtext')) return 'TEXT';
  if (type.includes('mediumtext')) return 'TEXT';
  if (type.includes('text')) return 'TEXT';
  if (type.includes('tinyint(1)')) return 'BOOLEAN';
  if (type.includes('bigint')) return 'BIGINT';
  if (type.includes('int')) {
    const unsigned = type.includes('unsigned') ? ` CHECK ("${field}" >= 0)` : '';
    return `INTEGER${unsigned}`;
  }
  if (type.includes('decimal') || type.includes('numeric')) {
    return `DECIMAL(${length || '10'},${precision || '2'})`;
  }
  if (type.includes('double')) return 'DOUBLE PRECISION';
  if (type.includes('float')) return 'REAL';
  if (type === 'date') return 'DATE';
  if (type === 'time') return 'TIME WITHOUT TIME ZONE';
  if (type.includes('timestamp')) return 'TIMESTAMP WITHOUT TIME ZONE';
  if (type === 'datetime') return 'TIMESTAMP WITHOUT TIME ZONE';
  if (type === 'year') return 'SMALLINT';
  if (type.includes('binary') || type.includes('varbinary')) return 'BYTEA';
  if (type.includes('blob')) return 'BYTEA';
  if (type.includes('json')) return 'JSONB';
  if (type.includes('enum')) {
    const values = type.match(/enum\((.*?)\)/i)[1].split(',').map(v => v.trim().replace(/'/g, ''));
    return `TEXT CHECK ("${field}" IN (${values.map(v => `'${v}'`).join(', ')}))`;
  }

  return 'TEXT';
}

module.exports = { mapDataType };
