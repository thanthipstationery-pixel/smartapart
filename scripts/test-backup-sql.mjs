import assert from 'node:assert';
import {
  ALLOWED_TABLES,
  escapeSqlValue,
  generateSqlDump,
  parseAndSanitizeSql,
} from '../src/lib/backupSql.ts';

console.log('================================================================');
console.log('    TEST SUITE: SQL DUMP GENERATOR & WHITELIST SANITIZER       ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// ============================================================================
// 1. ALLOWED_TABLES
// ============================================================================
console.log('--- Suite 1: ALLOWED_TABLES Structure ---');

runTest('1.1: Contains all 12 tables in topological order', () => {
  const expected = [
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
  ];
  assert.strictEqual(ALLOWED_TABLES.length, 12);
  assert.deepStrictEqual([...ALLOWED_TABLES], expected);
});

// ============================================================================
// 2. escapeSqlValue
// ============================================================================
console.log('\n--- Suite 2: escapeSqlValue Unit Tests ---');

runTest('2.1: null and undefined format to NULL', () => {
  assert.strictEqual(escapeSqlValue(null), 'NULL');
  assert.strictEqual(escapeSqlValue(undefined), 'NULL');
});

runTest('2.2: boolean formats to 1 or 0', () => {
  assert.strictEqual(escapeSqlValue(true), '1');
  assert.strictEqual(escapeSqlValue(false), '0');
});

runTest('2.3: numbers format correctly', () => {
  assert.strictEqual(escapeSqlValue(0), '0');
  assert.strictEqual(escapeSqlValue(42), '42');
  assert.strictEqual(escapeSqlValue(-15), '-15');
  assert.strictEqual(escapeSqlValue(3.14159), '3.14159');
  assert.strictEqual(escapeSqlValue(1e6), '1000000');
});

runTest('2.4: NaN and infinite numbers throw error', () => {
  assert.throws(() => escapeSqlValue(NaN), /Invalid number value/);
  assert.throws(() => escapeSqlValue(Infinity), /Invalid number value/);
  assert.throws(() => escapeSqlValue(-Infinity), /Invalid number value/);
});

runTest('2.5: strings are escaped and enclosed in single quotes', () => {
  assert.strictEqual(escapeSqlValue('hello world'), "'hello world'");
  assert.strictEqual(escapeSqlValue("O'Connor"), "'O''Connor'");
  assert.strictEqual(escapeSqlValue("''"), "''''''");
  assert.strictEqual(escapeSqlValue("line1\nline2\r\nline3\t"), "'line1\nline2\r\nline3\t'");
  assert.strictEqual(escapeSqlValue('สวัสดีชาวโลก 100%'), "'สวัสดีชาวโลก 100%'");
});

runTest('2.6: Date objects format to quoted ISO 8601 strings', () => {
  const date = new Date('2026-10-14T11:24:39.000Z');
  assert.strictEqual(escapeSqlValue(date), "'2026-10-14T11:24:39.000Z'");
});

runTest('2.7: Invalid Date objects throw error', () => {
  assert.throws(() => escapeSqlValue(new Date('invalid-date')), /Invalid Date object/);
});

runTest('2.8: BigInt formats to integer string', () => {
  assert.strictEqual(escapeSqlValue(9007199254740991n), '9007199254740991');
});

runTest('2.9: Objects and arrays format to JSON escaped strings', () => {
  const obj = { fee: "maid's fee", amount: 150 };
  assert.strictEqual(escapeSqlValue(obj), "'{\"fee\":\"maid''s fee\",\"amount\":150}'");
});

runTest('2.10: Unsupported types (Symbol, function) throw error', () => {
  assert.throws(() => escapeSqlValue(Symbol('sym')), /Unsupported value type/);
  assert.throws(() => escapeSqlValue(() => {}), /Unsupported value type/);
});

// ============================================================================
// 3. generateSqlDump
// ============================================================================
console.log('\n--- Suite 3: generateSqlDump Unit Tests ---');

runTest('3.1: Rejects unknown tables in tablesData', () => {
  assert.throws(
    () => generateSqlDump({ UnknownTable: [] }),
    /Disallowed table in backup data: "UnknownTable"/
  );
});

runTest('3.2: Rejects non-array table records', () => {
  assert.throws(
    () => generateSqlDump({ Room: 'not-an-array' }),
    /Data for table "Room" must be an array/
  );
});

runTest('3.3: Generates full dump with multiple tables in correct topological order', () => {
  const testData = {
    Property: [
      { id: 'p1', name: "Smart Apart O'Central", phone: '0812345678', address: null },
    ],
    Building: [
      { id: 'b1', name: 'Building A', propertyId: 'p1', waterRate: 18.0, electricityRate: 8.0 },
    ],
    Floor: [
      { id: 'f1', number: 1, buildingId: 'b1' },
    ],
    Room: [
      { id: 'r1', number: '101', type: 'AC', basePrice: 3500.0, floorId: 'f1', status: 'VACANT' },
    ],
  };

  const dump = generateSqlDump(testData);

  // Check header
  assert.ok(dump.includes('-- SmartApart SQLite Database Backup Dump'));
  assert.ok(dump.includes('BEGIN TRANSACTION;'));
  assert.ok(dump.includes('COMMIT;'));

  // Check DELETE FROM order (reverse topological: Room, Floor, Building, Property)
  const deleteRoomIdx = dump.indexOf('DELETE FROM "Room";');
  const deleteFloorIdx = dump.indexOf('DELETE FROM "Floor";');
  const deleteBuildingIdx = dump.indexOf('DELETE FROM "Building";');
  const deletePropertyIdx = dump.indexOf('DELETE FROM "Property";');

  assert.ok(deleteRoomIdx !== -1, 'Should contain DELETE FROM "Room"');
  assert.ok(deleteFloorIdx !== -1, 'Should contain DELETE FROM "Floor"');
  assert.ok(deleteBuildingIdx !== -1, 'Should contain DELETE FROM "Building"');
  assert.ok(deletePropertyIdx !== -1, 'Should contain DELETE FROM "Property"');

  assert.ok(deleteRoomIdx < deleteFloorIdx, 'Room should be deleted before Floor');
  assert.ok(deleteFloorIdx < deleteBuildingIdx, 'Floor should be deleted before Building');
  assert.ok(deleteBuildingIdx < deletePropertyIdx, 'Building should be deleted before Property');

  // Check INSERT INTO order (forward topological: Property, Building, Floor, Room)
  const insertPropertyIdx = dump.indexOf('INSERT INTO "Property"');
  const insertBuildingIdx = dump.indexOf('INSERT INTO "Building"');
  const insertFloorIdx = dump.indexOf('INSERT INTO "Floor"');
  const insertRoomIdx = dump.indexOf('INSERT INTO "Room"');

  assert.ok(insertPropertyIdx !== -1, 'Should contain INSERT INTO "Property"');
  assert.ok(insertBuildingIdx !== -1, 'Should contain INSERT INTO "Building"');
  assert.ok(insertFloorIdx !== -1, 'Should contain INSERT INTO "Floor"');
  assert.ok(insertRoomIdx !== -1, 'Should contain INSERT INTO "Room"');

  assert.ok(insertPropertyIdx < insertBuildingIdx, 'Property should be inserted before Building');
  assert.ok(insertBuildingIdx < insertFloorIdx, 'Building should be inserted before Floor');
  assert.ok(insertFloorIdx < insertRoomIdx, 'Floor should be inserted before Room');

  // Check escaped values and quoted columns
  assert.ok(dump.includes("'Smart Apart O''Central'"));
  assert.ok(dump.includes('"name"'));
  assert.ok(dump.includes('"propertyId"'));
  assert.ok(dump.includes('NULL'));
});

runTest('3.4: Handles empty table arrays gracefully', () => {
  const dump = generateSqlDump({
    Property: [],
    Room: [],
  });

  assert.ok(dump.includes('DELETE FROM "Room";'));
  assert.ok(dump.includes('DELETE FROM "Property";'));
  assert.ok(!dump.includes('INSERT INTO "Room"'));
  assert.ok(!dump.includes('INSERT INTO "Property"'));
});

// ============================================================================
// 4. parseAndSanitizeSql
// ============================================================================
console.log('\n--- Suite 4: parseAndSanitizeSql Unit Tests ---');

runTest('4.1: Successfully parses and sanitizes a valid dump from generateSqlDump', () => {
  const testData = {
    Property: [{ id: 'p1', name: 'Grand Mansion', phone: null }],
    Admin: [{ id: 'a1', username: 'admin', password: 'hash', name: 'Admin', createdAt: new Date() }],
    Building: [{ id: 'b1', name: 'Tower A', propertyId: 'p1', waterRate: 15.5, electricityRate: 7.0 }],
  };

  const dump = generateSqlDump(testData);
  const result = parseAndSanitizeSql(dump);

  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.error, undefined);
  assert.ok(Array.isArray(result.statements));
  // 3 DELETEs + 3 INSERTs = 6 statements (BEGIN and COMMIT stripped from DML)
  assert.strictEqual(result.statements.length, 6);

  // Check statement types
  const deleteCount = result.statements.filter((s) => s.startsWith('DELETE FROM')).length;
  const insertCount = result.statements.filter((s) => s.startsWith('INSERT INTO')).length;
  assert.strictEqual(deleteCount, 3);
  assert.strictEqual(insertCount, 3);
});

runTest('4.2: Strips comments and preserves semicolons inside string literals', () => {
  const sql = `
    -- Header comment
    /* Multi-line
       block comment */
    DELETE FROM "Room";
    -- Intermediate comment
    INSERT INTO "Room" ("id", "number") VALUES ('r1', 'Room; with; semicolons -- and comments /* block */');
  `;

  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.statements.length, 2);
  assert.strictEqual(result.statements[0], 'DELETE FROM "Room"');
  assert.ok(result.statements[1].includes("'Room; with; semicolons -- and comments /* block */'"));
});

runTest('4.3: Accepts strings with escaped single quotes', () => {
  const sql = `
    DELETE FROM "Tenant";
    INSERT INTO "Tenant" ("id", "name") VALUES ('t1', 'O''Connor');
  `;

  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.statements.length, 2);
  assert.ok(result.statements[1].includes("'O''Connor'"));
});

runTest('4.4: Permits safe text with words like "drop", "update", "create" inside string literals', () => {
  const sql = `
    DELETE FROM "Tenant";
    INSERT INTO "Tenant" ("id", "note") VALUES ('t1', 'Please drop the keys at office. Profile updated. New booking created.');
  `;

  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.statements.length, 2);
});

runTest('4.5: Rejects DROP TABLE', () => {
  const sql = `
    DELETE FROM "Room";
    DROP TABLE "Room";
  `;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('DROP'));
});

runTest('4.6: Rejects PRAGMA statements', () => {
  const sql = `
    PRAGMA foreign_keys = OFF;
    DELETE FROM "Room";
  `;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('PRAGMA'));
});

runTest('4.7: Rejects UPDATE statements', () => {
  const sql = `
    UPDATE "Admin" SET password = 'compromised' WHERE username = 'admin';
  `;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('UPDATE'));
});

runTest('4.8: Rejects ALTER TABLE statements', () => {
  const sql = `
    ALTER TABLE "Room" ADD COLUMN backdoor TEXT;
  `;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('ALTER'));
});

runTest('4.9: Rejects ATTACH and DETACH statements', () => {
  const sqlAttach = `ATTACH DATABASE '/tmp/injected.db' AS injected;`;
  const resAttach = parseAndSanitizeSql(sqlAttach);
  assert.strictEqual(resAttach.valid, false);
  assert.ok(resAttach.error?.includes('ATTACH'));

  const sqlDetach = `DETACH DATABASE injected;`;
  const resDetach = parseAndSanitizeSql(sqlDetach);
  assert.strictEqual(resDetach.valid, false);
  assert.ok(resDetach.error?.includes('DETACH'));
});

runTest('4.10: Rejects unknown tables in DELETE FROM', () => {
  const sql = `DELETE FROM "NonExistentTable";`;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('whitelist'));
});

runTest('4.11: Rejects unknown tables in INSERT INTO', () => {
  const sql = `INSERT INTO "MaliciousTable" ("id") VALUES ('evil');`;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('whitelist'));
});

runTest('4.12: Rejects DELETE with WHERE clause', () => {
  const sql = `DELETE FROM "Room" WHERE id = 'r1';`;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('Disallowed or malformed'));
});

runTest('4.13: Rejects INSERT with subquery (SELECT injection)', () => {
  const sql = `INSERT INTO "Room" ("id") SELECT "id" FROM "Tenant";`;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('SELECT'));
});

runTest('4.14: Rejects unterminated string literal', () => {
  const sql = `INSERT INTO "Room" ("id", "number") VALUES ('r1', 'unterminated string;`;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('Unterminated string literal'));
});

runTest('4.15: Rejects unterminated block comment', () => {
  const sql = `/* This block comment never ends\nDELETE FROM "Room";`;
  const result = parseAndSanitizeSql(sql);
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('Unterminated block comment'));
});

runTest('4.16: Handles empty or comments-only content safely', () => {
  const res1 = parseAndSanitizeSql('');
  assert.strictEqual(res1.valid, true);
  assert.strictEqual(res1.statements.length, 0);

  const res2 = parseAndSanitizeSql('-- only comments\n/* block comment */');
  assert.strictEqual(res2.valid, true);
  assert.strictEqual(res2.statements.length, 0);
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! (Exit Code 0)');
  process.exit(0);
} else {
  console.error(`FAILED: ${totalTests - passedTests} tests failed.`);
  process.exit(1);
}
