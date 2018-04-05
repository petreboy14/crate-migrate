const Bluebird = require('bluebird');
const crate = require('node-crate');
const redefine = require('redefine');

class CrateMigrate {
  constructor(dbOptions) {
    const options = dbOptions || {};
    const dbHost = options.dbHost || 'localhost';
    const dbPort = options.dbPort || 4200;
    this.migrateTable = options.migrateTable || 'migrations';

    crate.connect(dbHost, dbPort);
  }

  logMigration(migrationName) {
    return this.upsertTable()
      .then(() => crate.insert(this.migrateTable, { name: migrationName }))
      .then(() => crate.execute(`REFRESH TABLE ${this.migrateTable}`));
  }

  unlogMigration(migrationName) {
    return this.upsertTable()
      .then(() => crate.delete(this.migrateTable, `name='${migrationName}'`))
      .then(() => crate.execute(`REFRESH TABLE ${this.migrateTable}`));
  }

  executed() {
    return this.upsertTable()
      .then(() => {
        const query = `SELECT name FROM ${this.migrateTable} ORDER BY name`;
      
        return Bluebird.resolve(crate.execute(query))
      })
      .then((results) => {
        const migrations = [];
        results.json.forEach((migration) => {
          migrations.push(migration.name);
        });
        
        return Bluebird.resolve(migrations);
      });
  }

  upsertTable() {
    const tableQuery = 'SELECT * FROM information_schema.tables WHERE table_name = ? LIMIT 1';

    return Bluebird.resolve(crate.execute(tableQuery, [this.migrateTable]))
      .then((result) => {
        if (result.rowcount === 0) {
          const migrationSchema = {};
          migrationSchema[this.migrateTable] = {
            name: 'string primary key'
          };

          return Bluebird.resolve(crate.create(migrationSchema));
        }

        return Bluebird.resolve(true);
      });
  }
}

module.exports = CrateMigrate;