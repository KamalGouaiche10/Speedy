'use strict';

const db = require('../database/db');

class RestaurantDAO {
    // Ottieni tutti i ristoranti (per utenti anonimi e clienti)
    getAllRestaurants() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.name as owner_name, u.email as owner_email,
                       AVG(rev.rating) as avg_rating,
                       COUNT(DISTINCT rev.id) as review_count
                FROM restaurants r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id
                WHERE r.status = 'active'
                GROUP BY r.id
                ORDER BY r.created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Ottieni ristorante per ID
    getRestaurantById(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.name as owner_name,
                       AVG(rev.rating) as avg_rating,
                       COUNT(DISTINCT rev.id) as review_count
                FROM restaurants r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id
                WHERE r.id = ?
                GROUP BY r.id
            `;
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // RICERCA TESTUALE
    searchRestaurants(query) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, AVG(rev.rating) as avg_rating
                FROM restaurants r
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id
                WHERE r.status = 'active' 
                AND (r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)
                GROUP BY r.id
            `;
            const searchTerm = `%${query}%`;
            db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // GEOLOCALIZZAZIONE 
    getRestaurantsByLocation(latitude, longitude, radiusKm = 10) {
        return new Promise((resolve, reject) => {
            // Formula Haversine per calcolare distanza
            const sql = `
                SELECT r.*, 
                       (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                       cos(radians(longitude) - radians(?)) + 
                       sin(radians(?)) * sin(radians(latitude)))) AS distance,
                       AVG(rev.rating) as avg_rating
                FROM restaurants r
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id
                WHERE r.status = 'active'
                GROUP BY r.id
                HAVING distance < ?
                ORDER BY distance
            `;
            db.all(sql, [latitude, longitude, latitude, radiusKm], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Ottieni ristoranti di un proprietario
    getRestaurantsByOwner(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM restaurants WHERE user_id = ?';
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Crea ristorante (solo ristoratori)
    createRestaurant(userId, name, description, address, latitude, longitude, imageUrl) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO restaurants (user_id, name, description, address, latitude, longitude, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            db.run(sql, [userId, name, description, address, latitude, longitude, imageUrl], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Aggiorna ristorante (solo proprietario)
    updateRestaurant(id, name, description, address, latitude, longitude, imageUrl) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE restaurants 
                SET name = ?, description = ?, address = ?, latitude = ?, longitude = ?, image_url = ?
                WHERE id = ?
            `;
            db.run(sql, [name, description, address, latitude, longitude, imageUrl, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // OPERAZIONI ADMIN
    // Blocca/sblocca ristorante (solo admin)
    updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE restaurants SET status = ? WHERE id = ?';
            db.run(sql, [status, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Elimina ristorante (solo admin)
    deleteRestaurant(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM restaurants WHERE id = ?';
            db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Conta ristoranti (statistiche)
    countRestaurants() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM restaurants WHERE status = "active"';
            db.get(sql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    // Metodo per admin: ottieni tutti i ristoranti indipendentemente dallo status
    getAllRestaurantsAdmin() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.name as owner_name, u.email as owner_email,
                       AVG(rev.rating) as avg_rating,
                       COUNT(DISTINCT rev.id) as review_count
                FROM restaurants r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN reviews rev ON r.id = rev.restaurant_id
                GROUP BY r.id
                ORDER BY r.created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = new RestaurantDAO();