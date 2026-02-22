'use strict';

const db = require('../database/db');

class ReviewDAO {
    // Ottieni recensioni di un ristorante
    getReviewsByRestaurant(restaurantId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.name as user_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.restaurant_id = ?
                ORDER BY r.created_at DESC
            `;
            db.all(sql, [restaurantId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Ottieni recensione per ID (utile per verifiche di ownership)
    getReviewById(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*
                FROM reviews r
                WHERE r.id = ?
            `;
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Crea recensione (solo clienti che hanno ordinato)
    createReview(userId, restaurantId, rating, comment) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO reviews (user_id, restaurant_id, rating, comment)
                VALUES (?, ?, ?, ?)
            `;
            db.run(sql, [userId, restaurantId, rating, comment], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Aggiorna recensione (solo autore)
    updateReview(id, rating, comment) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?';
            db.run(sql, [rating, comment, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Elimina recensione (autore o admin)
    deleteReview(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM reviews WHERE id = ?';
            db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // OPERAZIONI ADMIN
    // Ottieni tutte le recensioni (moderazione admin)
    getAllReviews() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.name as user_name, rest.name as restaurant_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN restaurants rest ON r.restaurant_id = rest.id
                ORDER BY r.created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = new ReviewDAO();