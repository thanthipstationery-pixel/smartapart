/**
 * SmartApart Database Backup & Restore SQL Utility
 * 
 * Target platform: Cloudflare Workers (OpenNext/Edge) & Node.js
 * Pure TypeScript with zero native dependencies.
 */

/**
 * All 12 tables in topological foreign-key dependency order:
 * Parent tables precede child tables.
 */
export const ALLOWED_TABLES = [
  'Property',
  'Admin',
  'Building',
  'Floor',
  'Room',
  'Tenant',
  'Booking',
  'MeterReading',
  'Invoice',
  'Payment',
  'MeterReplacement',
  'BuildingMonthlyUtility',
] as const;

export type AllowedTable = (typeof ALLOWED_TABLES)[number];

/**
 * Result of parsing and sanitizing SQL backup content.
 */
export interface SanitizeResult {
  valid: boolean;
  error?: string;
  statements: string[];
}

/**
 * Safely escapes an arbitrary JavaScript value into a SQLite SQL literal.
 * - null / undefined -> NULL
 * - boolean -> 1 or 0
 * - number -> numeric string (throws on NaN or infinite)
 * - Date -> 'YYYY-MM-DDTHH:mm:ss.sssZ'
 * - string -> 'escaped string' with single quotes doubled ('')
 * - object / array -> JSON stringified and escaped
 */
export function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }

  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }

  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      throw new Error(`Invalid number value (${val}): NaN and Infinite numbers cannot be escaped to SQL`);
    }
    return String(val);
  }

  if (typeof val === 'bigint') {
    return val.toString();
  }

  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) {
      throw new Error('Invalid Date object cannot be escaped to SQL');
    }
    return `'${val.toISOString()}'`;
  }

  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`;
  }

  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }

  throw new Error(`Unsupported value type (${typeof val}) for SQL escaping`);
}

/**
 * Generates complete SQL dump text from table records:
 * 1. Comment header with timestamp
 * 2. BEGIN TRANSACTION;
 * 3. DELETE FROM ... in reverse topological order (children before parents)
 * 4. INSERT INTO ... in forward topological order (parents before children)
 * 5. COMMIT;
 */
export function generateSqlDump(tablesData: Record<string, any[]>): string {
  // Validate that only allowed tables are present
  for (const key of Object.keys(tablesData)) {
    if (!ALLOWED_TABLES.includes(key as AllowedTable)) {
      throw new Error(`Disallowed table in backup data: "${key}". Allowed tables are: ${ALLOWED_TABLES.join(', ')}`);
    }
    if (!Array.isArray(tablesData[key])) {
      throw new Error(`Data for table "${key}" must be an array of records`);
    }
  }

  const lines: string[] = [];
  const tablesToDump = ALLOWED_TABLES.filter(
    (table) => table in tablesData && Array.isArray(tablesData[table])
  );

  // Header comment
  lines.push('-- SmartApart SQLite Database Backup Dump');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Included Tables (${tablesToDump.length}): ${tablesToDump.join(', ')}`);
  lines.push('');
  lines.push('BEGIN TRANSACTION;');
  lines.push('');

  // 1. Clean existing records in reverse topological order
  lines.push('-- Clean existing records (reverse topological order)');
  const reversedTables = [...tablesToDump].reverse();
  for (const table of reversedTables) {
    lines.push(`DELETE FROM "${table}";`);
  }
  lines.push('');

  // 2. Insert records in topological order
  lines.push('-- Populate records (topological order)');
  for (const table of tablesToDump) {
    const rows = tablesData[table];
    if (rows.length === 0) continue;

    // Collect all column names across rows to handle sparse/optional fields
    const columnSet = new Set<string>();
    for (const row of rows) {
      if (row && typeof row === 'object') {
        for (const col of Object.keys(row)) {
          columnSet.add(col);
        }
      }
    }
    const columns = Array.from(columnSet);
    if (columns.length === 0) continue;

    const colsSql = columns.map((col) => `"${col}"`).join(', ');

    for (const row of rows) {
      const valsSql = columns.map((col) => escapeSqlValue(row[col])).join(', ');
      lines.push(`INSERT INTO "${table}" (${colsSql}) VALUES (${valsSql});`);
    }
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}

/**
 * Replaces string literals in SQL with empty quotes ''
 * to allow accurate keyword and syntax inspection without false positives from string contents.
 */
function stripStringLiterals(sql: string): string {
  let result = '';
  let inString = false;
  const len = sql.length;

  for (let i = 0; i < len; i++) {
    const c = sql[i];
    const next = i + 1 < len ? sql[i + 1] : '';

    if (inString) {
      if (c === "'") {
        if (next === "'") {
          // Escaped quote ('') inside string literal
          i++;
        } else {
          inString = false;
          result += "''";
        }
      }
    } else {
      if (c === "'") {
        inString = true;
      } else {
        result += c;
      }
    }
  }

  return result;
}

/**
 * Tokenizes SQL by statement-terminating semicolons while properly
 * respecting single-quoted strings (and escaped '' quotes) and stripping comments (-- and /* *\/).
 */
function splitSqlStatements(sql: string): { error?: string; rawStatements: string[] } {
  const rawStatements: string[] = [];
  let current = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  const len = sql.length;
  for (let i = 0; i < len; i++) {
    const c = sql[i];
    const next = i + 1 < len ? sql[i + 1] : '';

    if (inLineComment) {
      if (c === '\n' || c === '\r') {
        inLineComment = false;
        current += ' ';
      }
      continue;
    }

    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++; // skip '/'
        current += ' ';
      }
      continue;
    }

    if (inString) {
      current += c;
      if (c === "'") {
        if (next === "'") {
          current += next;
          i++; // skip escaped quote
        } else {
          inString = false;
        }
      }
      continue;
    }

    // Normal state
    if (c === '-' && next === '-') {
      inLineComment = true;
      i++; // skip second '-'
      continue;
    }

    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++; // skip '*'
      continue;
    }

    if (c === "'") {
      inString = true;
      current += c;
      continue;
    }

    if (c === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        rawStatements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += c;
  }

  if (inString) {
    return { error: 'Unterminated string literal in SQL content', rawStatements: [] };
  }

  if (inBlockComment) {
    return { error: 'Unterminated block comment in SQL content', rawStatements: [] };
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    rawStatements.push(trimmed);
  }

  return { rawStatements };
}

/**
 * Disallowed keywords that must never appear in executable positions.
 */
const DISALLOWED_KEYWORDS = [
  'DROP',
  'ALTER',
  'CREATE',
  'PRAGMA',
  'ATTACH',
  'DETACH',
  'UPDATE',
  'SELECT',
  'EXEC',
  'EXECUTE',
  'REPLACE',
  'TRUNCATE',
  'VACUUM',
  'REINDEX',
  'GRANT',
  'REVOKE',
  'UNION',
];

const DISALLOWED_REGEX = new RegExp(`\\b(${DISALLOWED_KEYWORDS.join('|')})\\b`, 'i');

/**
 * Parses and sanitizes SQL backup content.
 * - Strips comments (-- and /* *\/)
 * - Splits statements by semicolons, ignoring semicolons inside string literals
 * - Validates that every statement is strictly either DELETE FROM "TableName"
 *   or INSERT INTO "TableName" (...) VALUES (...) where TableName is in ALLOWED_TABLES
 * - Rejects any disallowed keywords or unknown tables
 * - Recognizes transaction markers (BEGIN / COMMIT) and safely excludes them from statements
 */
export function parseAndSanitizeSql(sqlContent: string): SanitizeResult {
  const { error, rawStatements } = splitSqlStatements(sqlContent);
  if (error) {
    return { valid: false, error, statements: [] };
  }

  const validStatements: string[] = [];

  for (const rawStmt of rawStatements) {
    const stmt = rawStmt.trim().replace(/;+$/, '');
    if (!stmt) continue;

    // Recognize standard transaction boundary statements
    const normalizedTx = stmt.toUpperCase().replace(/\s+/g, ' ');
    if (
      normalizedTx === 'BEGIN' ||
      normalizedTx === 'BEGIN TRANSACTION' ||
      normalizedTx === 'COMMIT' ||
      normalizedTx === 'COMMIT TRANSACTION' ||
      normalizedTx === 'END' ||
      normalizedTx === 'END TRANSACTION'
    ) {
      // Valid transaction marker; excluded from executable DML statements
      continue;
    }

    // Strip string literals to inspect syntax and keywords
    const stripped = stripStringLiterals(stmt);

    // Reject any disallowed SQL keywords
    const keywordMatch = stripped.match(DISALLOWED_REGEX);
    if (keywordMatch) {
      return {
        valid: false,
        error: `Disallowed SQL keyword detected: "${keywordMatch[1].toUpperCase()}"`,
        statements: [],
      };
    }

    // Validate DELETE FROM
    const deleteMatch = stripped.match(
      /^\s*DELETE\s+FROM\s+(["'`\[]?([A-Za-z0-9_]+)["'`\]]?)\s*$/i
    );
    if (deleteMatch) {
      const tableName = deleteMatch[2];
      const isAllowed = ALLOWED_TABLES.some(
        (t) => t.toLowerCase() === tableName.toLowerCase()
      );
      if (!isAllowed) {
        return {
          valid: false,
          error: `Table "${tableName}" in DELETE statement is not in ALLOWED_TABLES whitelist`,
          statements: [],
        };
      }
      validStatements.push(stmt);
      continue;
    }

    // Validate INSERT INTO
    const insertMatch = stripped.match(
      /^\s*INSERT\s+INTO\s+(["'`\[]?([A-Za-z0-9_]+)["'`\]]?)\s*\(([\s\S]+?)\)\s*VALUES\s*([\s\S]+)$/i
    );
    if (insertMatch) {
      const tableName = insertMatch[2];
      const isAllowed = ALLOWED_TABLES.some(
        (t) => t.toLowerCase() === tableName.toLowerCase()
      );
      if (!isAllowed) {
        return {
          valid: false,
          error: `Table "${tableName}" in INSERT statement is not in ALLOWED_TABLES whitelist`,
          statements: [],
        };
      }

      const valuesPart = insertMatch[4].trim();
      if (!/^\([\s\S]*\)$/.test(valuesPart)) {
        return {
          valid: false,
          error: `Malformed INSERT statement VALUES clause in statement: "${stmt.slice(0, 80)}"`,
          statements: [],
        };
      }

      validStatements.push(stmt);
      continue;
    }

    // If it does not match DELETE FROM or INSERT INTO on an allowed table, reject
    return {
      valid: false,
      error: `Disallowed or malformed SQL statement: "${stmt.slice(0, 80)}"`,
      statements: [],
    };
  }

  return { valid: true, statements: validStatements };
}
