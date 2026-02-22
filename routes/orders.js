'use strict';

const express = require('express');
const router = express.Router();
const { isLoggedIn, isCustomer, isRestaurant } = require('../middleware/auth');
const orderDao = require('../models/order-dao');
const restaurantDao = require('../models/restaurant-dao');

//Crea nuovo ordine (solo clienti)
router.post('/', isCustomer, async (req, res) => {
    try {
        const { restaurantId, items, totalPrice, deliveryAddress, notes } = req.body;
        
        // Validazione
        if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Dati ordine non validi' });
        }

        if (!totalPrice || totalPrice <= 0) {
            return res.status(400).json({ error: 'Totale non valido' });
        }

        if (!deliveryAddress) {
            return res.status(400).json({ error: 'Indirizzo di consegna mancante' });
        }

        // Verifica che il ristorante esista
        const restaurant = await restaurantDao.getRestaurantById(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Ristorante non trovato' });
        }

        if (restaurant.status !== 'active') {
            return res.status(400).json({ error: 'Ristorante non disponibile' });
        }

        const orderId = await orderDao.createOrder(
            req.user.id,
            restaurantId,
            items,
            parseFloat(totalPrice),
            deliveryAddress,
            notes || ''
        );

        res.status(201).json({ 
            message: 'Ordine creato con successo', 
            orderId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ottieni ordini del cliente loggato
router.get('/my-orders', isCustomer, async (req, res) => {
    try {
        const orders = await orderDao.getOrdersByCustomer(req.user.id);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ottieni ordini di un ristorante (solo ristoratore proprietario)
router.get('/restaurant/:restaurantId', isRestaurant, async (req, res) => {
    try {
        const restaurantId = req.params.restaurantId;
        
        // Verifica proprietà ristorante
        const restaurant = await restaurantDao.getRestaurantById(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Ristorante non trovato' });
        }

        if (restaurant.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        const orders = await orderDao.getOrdersByRestaurant(restaurantId);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ottieni dettagli ordine
router.get('/:id', isLoggedIn, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await orderDao.getOrderDetails(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Ordine non trovato' });
        }

        // Verifica autorizzazione (cliente che ha fatto l'ordine, ristoratore del ristorante, o admin)
        const restaurant = await restaurantDao.getRestaurantById(order.restaurant_id);
        
        const isOwner = order.customer_id === req.user.id;
        const isRestaurantOwner = restaurant.user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isRestaurantOwner && !isAdmin) {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aggiorna stato ordine (solo ristoratore proprietario)
router.put('/:id/status', isRestaurant, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        
        // Validazione status
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status non valido' });
        }

        const order = await orderDao.getOrderDetails(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Ordine non trovato' });
        }

        // Verifica proprietà ristorante
        const restaurant = await restaurantDao.getRestaurantById(order.restaurant_id);
        
        if (restaurant.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        await orderDao.updateOrderStatus(orderId, status);
        res.json({ message: 'Stato ordine aggiornato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;