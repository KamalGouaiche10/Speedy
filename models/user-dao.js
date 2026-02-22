'use strict';

const db = require('../database/db');
const bcrypt = require('bcrypt');

// Helper per riconoscere un hash bcrypt
function isBcryptHash(s) {
    return typeof s === 'string' && /^\$2[abxy]\$\d{2}\$/.test(s);
}

class UserDAO {
    // Trova utente per email (per login)
    getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            db.get(sql, [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Trova utente per ID
    getUserById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, email, name, role, phone, address FROM users WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Crea nuovo utente (registrazione) - PASSWORD IN CHIARO
    async createUser(email, password, name, role, phone = null, address = null) {
        // Hash della password prima di salvare
        const saltRounds = 10;
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, saltRounds)
                .then((hash) => {
                    const sql = 'INSERT INTO users (email, password, name, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)';
                    db.run(sql, [email, hash, name, role, phone, address], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                })
                .catch(err => reject(err));
        });
    }

    // Verifica password - CONFRONTO DIRETTO
    async checkPassword(user, password) {
        // Supporta sia hash bcrypt (nuovi utenti) sia password in chiaro
        if (!user || !user.password) return false;
        try {
            if (isBcryptHash(user.password)) {
                // confronto sicuro con bcrypt
                return await bcrypt.compare(password, user.password);
            } else {
                // legacy: password salvata in chiaro (test), confronto diretto.
                return password === user.password;
            }
        } catch (err) {
            return false;
        }
    }

    // OPERAZIONI ADMIN
    // Ottieni tutti gli utenti 
    getAllUsers() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, email, name, role, phone, address, created_at FROM users ORDER BY created_at DESC';
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Elimina utente 
    deleteUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM users WHERE id = ?';
            db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }


    // Conta utenti 
    countUsers() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM users';
            db.get(sql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }
}

module.exports = new UserDAO();