'use strict';

const db = require('../database/db');

class MenuDAO {
    // Ottieni tutti i piatti di un ristorante
    getMenuByRestaurant(restaurantId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM menu_items 
                WHERE restaurant_id = ? AND available = 1
                ORDER BY category, name
            `;
            db.all(sql, [restaurantId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Ottieni piatto per ID
    getMenuItemById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM menu_items WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // RICERCA PIATTI
    searchMenuItems(query) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT m.*, r.name as restaurant_name
                FROM menu_items m
                JOIN restaurants r ON m.restaurant_id = r.id
                WHERE m.available = 1 
                AND (m.name LIKE ? OR m.description LIKE ? OR m.category LIKE ?)
            `;
            const searchTerm = `%${query}%`;
            db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Crea piatto (solo ristoratore proprietario)
    createMenuItem(restaurantId, name, description, price, category, imageUrl) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            db.run(sql, [restaurantId, name, description, price, category, imageUrl], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Aggiorna piatto (solo ristoratore proprietario)
    updateMenuItem(id, name, description, price, category, imageUrl, available) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE menu_items 
                SET name = ?, description = ?, price = ?, category = ?, image_url = ?, available = ?
                WHERE id = ?
            `;
            db.run(sql, [name, description, price, category, imageUrl, available, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Elimina piatto (solo ristoratore proprietario)
    deleteMenuItem(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM menu_items WHERE id = ?';
            db.run(sql, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
}

module.exports = new MenuDAO();