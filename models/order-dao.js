'use strict';

const db = require('../database/db');

class OrderDAO {
    // Crea ordine (solo clienti)
    async createOrder(customerId, restaurantId, items, totalPrice, deliveryAddress, notes) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // Inserisci ordine
                const sqlOrder = `
                    INSERT INTO orders (customer_id, restaurant_id, total_price, delivery_address, notes)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.run(sqlOrder, [customerId, restaurantId, totalPrice, deliveryAddress, notes], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                    }
                    
                    const orderId = this.lastID;
                    
                    // Inserisci items dell'ordine
                    const sqlItems = 'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)';
                    const stmt = db.prepare(sqlItems);
                    
                    items.forEach(item => {
                        stmt.run([orderId, item.menu_item_id, item.quantity, item.price], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return reject(err);
                            }
                        });
                    });
                    
                    stmt.finalize((err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }
                        db.run('COMMIT');
                        resolve(orderId);
                    });
                });
            });
        });
    }

    // Ottieni ordini di un cliente
    getOrdersByCustomer(customerId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT o.*, r.name as restaurant_name, r.address as restaurant_address
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.id
                WHERE o.customer_id = ?
                ORDER BY o.created_at DESC
            `;
            db.all(sql, [customerId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Ottieni ordini di un ristorante (per ristoratore)
    getOrdersByRestaurant(restaurantId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT o.*, u.name as customer_name, u.phone as customer_phone
                FROM orders o
                JOIN users u ON o.customer_id = u.id
                WHERE o.restaurant_id = ?
                ORDER BY o.created_at DESC
            `;
            db.all(sql, [restaurantId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Ottieni dettagli ordine con items
    getOrderDetails(orderId) {
        return new Promise((resolve, reject) => {
            const sqlOrder = `
                SELECT o.*, r.name as restaurant_name, u.name as customer_name
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.id
                JOIN users u ON o.customer_id = u.id
                WHERE o.id = ?
            `;
            
            const sqlItems = `
                SELECT oi.*, m.name as item_name
                FROM order_items oi
                JOIN menu_items m ON oi.menu_item_id = m.id
                WHERE oi.order_id = ?
            `;
            
            db.get(sqlOrder, [orderId], (err, order) => {
                if (err) return reject(err);
                if (!order) return resolve(null);
                
                db.all(sqlItems, [orderId], (err, items) => {
                    if (err) return reject(err);
                    order.items = items;
                    resolve(order);
                });
            });
        });
    }

    // Aggiorna stato ordine (ristoratore)
    updateOrderStatus(orderId, status) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE orders SET status = ? WHERE id = ?';
            db.run(sql, [status, orderId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // OPERAZIONI ADMIN
    // Ottieni tutti gli ordini 
    getAllOrders() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT o.*, r.name as restaurant_name, u.name as customer_name
                FROM orders o
                JOIN restaurants r ON o.restaurant_id = r.id
                JOIN users u ON o.customer_id = u.id
                ORDER BY o.created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Conta ordini (statistiche)
    countOrders() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM orders';
            db.get(sql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    // Calcola fatturato totale
    getTotalRevenue() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT SUM(total_price) as revenue 
                FROM orders 
                WHERE status != 'cancelled'
            `;
            db.get(sql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row.revenue || 0);
            });
        });
    }
}

module.exports = new OrderDAO();