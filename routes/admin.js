'use strict';

const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const userDao = require('../models/user-dao');
const restaurantDao = require('../models/restaurant-dao');
const orderDao = require('../models/order-dao');
const reviewDao = require('../models/review-dao');


// GESTIONE UTENTI
//Ottieni tutti gli utenti
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await userDao.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Elimina utente
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Impedisci di eliminare se stesso
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Non puoi eliminare il tuo account' });
        }

        const result = await userDao.deleteUser(userId);
        
        if (result === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        res.json({ message: 'Utente eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GESTIONE RISTORANTI
//Ottieni tutti i ristoranti (include bloccati)
router.get('/restaurants', isAdmin, async (req, res) => {
    try {
    // Usa metodo admin che include anche i ristoranti bloccati
    const restaurants = await restaurantDao.getAllRestaurantsAdmin();
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Blocca
router.put('/restaurants/:id/status', isAdmin, async (req, res) => {
    try {
        const restaurantId = req.params.id;
        const { status } = req.body;
        
        // Validazione status
        if (!status || !['active', 'blocked'].includes(status)) {
            return res.status(400).json({ error: 'Status non valido. Usa "active" o "blocked"' });
        }

        await restaurantDao.updateStatus(restaurantId, status);
        res.json({ message: `Ristorante ${status === 'active' ? 'sbloccato' : 'bloccato'} con successo` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Elimina ristorante
router.delete('/restaurants/:id', isAdmin, async (req, res) => {
    try {
        await restaurantDao.deleteRestaurant(req.params.id);
        res.json({ message: 'Ristorante eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GESTIONE ORDINI
// Ottieni tutti gli ordini
router.get('/orders', isAdmin, async (req, res) => {
    try {
        const orders = await orderDao.getAllOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GESTIONE RECENSIONI 
// Ottieni tutte le recensioni
router.get('/reviews', isAdmin, async (req, res) => {
    try {
        const reviews = await reviewDao.getAllReviews();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Elimina recensione inappropriata
router.delete('/reviews/:id', isAdmin, async (req, res) => {
    try {
        const changes = await reviewDao.deleteReview(req.params.id);
        if (changes === 0) {
            return res.status(404).json({ error: 'Recensione non trovata' });
        }
        res.json({ message: 'Recensione eliminata con successo', deletedId: parseInt(req.params.id) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STATISTICHE
//Ottieni statistiche globali
router.get('/statistics', isAdmin, async (req, res) => {
    try {
        const stats = {
            totalUsers: await userDao.countUsers(),
            totalRestaurants: await restaurantDao.countRestaurants(),
            totalOrders: await orderDao.countOrders(),
            totalRevenue: await orderDao.getTotalRevenue()
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;