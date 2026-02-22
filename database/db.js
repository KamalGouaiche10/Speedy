'use strict';

const sqlite3 = require('sqlite3');
const path = require('path');

// Apri database
const db = new sqlite3.Database(
    path.join(__dirname, 'schema.db'),
    (err) => {
        if (err) throw err;
        console.log('Database connesso');
    }
);

// Abilita foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;