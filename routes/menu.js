'use strict';

const express = require('express');
const router = express.Router();
const { isLoggedIn, isRestaurant } = require('../middleware/auth');
const menuDao = require('../models/menu-dao');
const restaurantDao = require('../models/restaurant-dao');

// Ottieni menù di un ristorante (pubblico)
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const menuItems = await menuDao.getMenuByRestaurant(req.params.restaurantId);
        res.json(menuItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Ricerca piatti (pubblico)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Query di ricerca mancante' });
        }

        const results = await menuDao.searchMenuItems(q);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ottieni piatto per ID (pubblico)
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await menuDao.getMenuItemById(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Piatto non trovato' });
        }
        
        res.json(menuItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crea nuovo piatto (solo ristoratore proprietario)
router.post('/', isRestaurant, async (req, res) => {
    try {
        const { restaurant_id, name, description, price, category, image_url } = req.body;
        
        // Validazione
        if (!restaurant_id || !name || !price) {
            return res.status(400).json({ error: 'Campi obbligatori mancanti' });
        }

        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ error: 'Prezzo non valido' });
        }

        // Verifica proprietà ristorante
        const restaurant = await restaurantDao.getRestaurantById(restaurant_id);
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Ristorante non trovato' });
        }

        if (restaurant.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        const menuItemId = await menuDao.createMenuItem(
            restaurant_id,
            name,
            description || null,
            parseFloat(price),
            category || null,
            image_url || null
        );

        res.status(201).json({ 
            message: 'Piatto creato con successo', 
            menuItemId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Aggiorna piatto (solo ristoratore proprietario)
router.put('/:id', isRestaurant, async (req, res) => {
    try {
        const menuItemId = req.params.id;
        const menuItem = await menuDao.getMenuItemById(menuItemId);
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Piatto non trovato' });
        }

        // Verifica proprietà ristorante
        const restaurant = await restaurantDao.getRestaurantById(menuItem.restaurant_id);
        
        if (restaurant.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        const { name, description, price, category, image_url, available } = req.body;

        await menuDao.updateMenuItem(
            menuItemId,
            name,
            description,
            parseFloat(price),
            category,
            image_url,
            available !== undefined ? available : true
        );

        res.json({ message: 'Piatto aggiornato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Elimina piatto (solo ristoratore proprietario)
router.delete('/:id', isRestaurant, async (req, res) => {
    try {
        const menuItemId = req.params.id;
        const menuItem = await menuDao.getMenuItemById(menuItemId);
        
        if (!menuItem) {
            return res.status(404).json({ error: 'Piatto non trovato' });
        }

        // Verifica proprietà ristorante
        const restaurant = await restaurantDao.getRestaurantById(menuItem.restaurant_id);
        
        if (restaurant.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        await menuDao.deleteMenuItem(menuItemId);
        res.json({ message: 'Piatto eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;