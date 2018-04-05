const chai = require('chai');
const crate = require('node-crate');
chai.should();

const MIGRATE_TEST_TABLE = 'migrate_test';

const CrateMigrate = require('../index');
crate.connect('localhost', 4200);

describe('crate-migrate tests', () => {
  const migrate = new CrateMigrate({ migrateTable: MIGRATE_TEST_TABLE });

  after((done) => {
    crate.drop(MIGRATE_TEST_TABLE)
      .then(() => done());
  });

  it('should be able to instantiate a new migration object with default options', () => {
    migrate2 = new CrateMigrate();
    migrate2.migrateTable.should.equal('migrations');
  });

  it('should be able to upsert a migration table', (done) => {
    migrate.upsertTable()
      .then(() => done())
      .catch(done);
  });

  it('should be able to store a processed migration', (done) => {
    migrate.logMigration('test-migration-0000')
      .then(() => {
        return crate.execute(`SELECT name FROM ${MIGRATE_TEST_TABLE} where name = ?`, ['test-migration-0000']);
      })
      .then((results) => {
        const migrations = results.json;
        migrations.length.should.equal(1);
        migrations[0].name.should.equal('test-migration-0000');
        done();
      })
      .catch(done);
  });

  it('should be able to return a list of migrations', (done) => {
    migrate.executed()
      .then((results) => {
        results.should.be.an.instanceOf(Array);
        results.length.should.equal(1);
        results[0].should.equal('test-migration-0000');
        done();
      })
      .catch(done);
  });
  it('should be able to delete a migration', (done) => {
    migrate.unlogMigration('test-migration-0000')
      .then(() => crate.execute(`SELECT name FROM ${MIGRATE_TEST_TABLE}`))
      .then((results) => {
        results.json.length.should.equal(0);
        done();
      });
  });
});