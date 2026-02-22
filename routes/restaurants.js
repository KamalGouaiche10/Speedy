'use strict';

const express = require('express');
const router = express.Router();
const { isLoggedIn, isRestaurant } = require('../middleware/auth');
const restaurantDao = require('../models/restaurant-dao');

router.get('/', async (req, res) => {
    try {
        const restaurants = await restaurantDao.getAllRestaurants();
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query di ricerca mancante' });
        }
        const results = await restaurantDao.searchRestaurants(q);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Coordinate mancanti' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = radius ? parseFloat(radius) : 10;

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ error: 'Coordinate non valide' });
        }

        const restaurants = await restaurantDao.getRestaurantsByLocation(latitude, longitude, radiusKm);
        
        // Ritorna sempre JSON per le API
        res.json(restaurants);
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const restaurant = await restaurantDao.getRestaurantById(req.params.id);
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Ristorante non trovato' });
        }
        
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROUTES PROTETTE (SOLO RISTORATORI)
router.get('/my', isRestaurant, async (req, res) => {
    try {
        const restaurants = await restaurantDao.getRestaurantsByOwner(req.user.id);
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isRestaurant, async (req, res) => {
    try {
        const { name, description, address, latitude, longitude, image_url } = req.body;
        
        // Validazione
        if (!name || !address) {
            return res.status(400).json({ error: 'Nome e indirizzo obbligatori' });
        }

        const restaurantId = await restaurantDao.createRestaurant(
            req.user.id,
            name,
            description || null,
            address,
            latitude || null,
            longitude || null,
            image_url || null
        );

        res.status(201).json({ 
            message: 'Ristorante creato con successo', 
            restaurantId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', isRestaurant, async (req, res) => {
    try {
        const restaurantId = req.params.id;
        
        // Verifica proprietà (solo proprietario o admin)
        const restaurant = await restaurantDao.getRestaurantById(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Ristorante non trovato' });
        }

        if (restaurant.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        const { name, description, address, latitude, longitude, image_url } = req.body;

        await restaurantDao.updateRestaurant(
            restaurantId,
            name,
            description,
            address,
            latitude,
            longitude,
            image_url
        );

        res.json({ message: 'Ristorante aggiornato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', isRestaurant, async (req, res) => {
    try {
        const restaurantId = req.params.id;
        
        // Verifica proprietà 
        const restaurant = await restaurantDao.getRestaurantById(restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Ristorante non trovato' });
        }

        if (restaurant.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        await restaurantDao.deleteRestaurant(restaurantId);
        res.json({ message: 'Ristorante eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;