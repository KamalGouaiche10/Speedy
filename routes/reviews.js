'use strict';

const express = require('express');
const router = express.Router();
const { isLoggedIn, isCustomer } = require('../middleware/auth');
const reviewDao = require('../models/review-dao');
const restaurantDao = require('../models/restaurant-dao');

//Ottieni recensioni di un ristorante (pubblico)
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const reviews = await reviewDao.getReviewsByRestaurant(req.params.restaurantId);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crea recensione (solo clienti)
router.post('/', isCustomer, async (req, res) => {
    try {
        const { restaurantId, rating, comment } = req.body;
        
        // Validazione
        if (!restaurantId || !rating) {
            return res.status(400).json({ error: 'Ristorante e valutazione obbligatori' });
        }

        const ratingNum = parseInt(rating);
        
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Valutazione deve essere tra 1 e 5' });
        }

        // Verifica che il ristorante esista
        const restaurant = await restaurantDao.getRestaurantById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ error: 'Ristorante non trovato' });
        }

        const reviewId = await reviewDao.createReview(
            req.user.id,
            restaurantId,
            ratingNum,
            comment || null
        );

        res.status(201).json({ 
            message: 'Recensione creata con successo', 
            reviewId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Aggiorna recensione (solo autore)
router.put('/:id', isLoggedIn, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { rating, comment } = req.body;
        
        // Validazione rating
        const ratingNum = parseInt(rating);
        
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Valutazione deve essere tra 1 e 5' });
        }

        // Verifica che l'utente sia l'autore della recensione
        const existing = await reviewDao.getReviewById(reviewId);
        if (!existing) {
            return res.status(404).json({ error: 'Recensione non trovata' });
        }

        if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        await reviewDao.updateReview(reviewId, ratingNum, comment);
        res.json({ message: 'Recensione aggiornata con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Elimina recensione (solo autore o admin)
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const reviewId = req.params.id;
        
        // Permetti all'autore della recensione o agli admin di eliminarla
        const existing = await reviewDao.getReviewById(reviewId);
        if (!existing) {
            return res.status(404).json({ error: 'Recensione non trovata' });
        }

        if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Non autorizzato' });
        }

        await reviewDao.deleteReview(reviewId);
        res.json({ message: 'Recensione eliminata con successo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;