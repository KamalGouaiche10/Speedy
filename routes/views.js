'use strict';

const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin, isRestaurant, isCustomer } = require('../middleware/auth');
const restaurantDao = require('../models/restaurant-dao');
const menuDao = require('../models/menu-dao');
const orderDao = require('../models/order-dao');
const reviewDao = require('../models/review-dao');
const userDao = require('../models/user-dao');

// HOME PAGE
router.get('/', async (req, res) => {
    try {
        const restaurants = await restaurantDao.getAllRestaurants();
        res.render('home', { 
            title: 'Home - Speedy',
            restaurants: restaurants.slice(0, 6) // Primi 6
        });
    } catch (err) {
        console.error(err);
        res.render('home', { 
            title: 'Home - Speedy',
            restaurants: [],
            error: 'Errore nel caricamento dei ristoranti'
        });
    }
});

// LISTA RISTORANTI
router.get('/restaurants', async (req, res) => {
    try {
        // Supporta ricerca per vicinanze o ricerca testuale tramite q
        const { nearby, lat, lng, radius, q } = req.query;

        let restaurants;
        let nearbyActive = false;
        let nearbyInfo = null;

        if (nearby === 'true' && lat && lng) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const radiusKm = radius ? parseFloat(radius) : 10;

            if (!isNaN(latitude) && !isNaN(longitude)) {
                try {
                    restaurants = await restaurantDao.getRestaurantsByLocation(latitude, longitude, radiusKm);
                    nearbyActive = true;
                    nearbyInfo = { latitude, longitude, radiusKm };
                } catch (err) {
                    console.error('Errore durante la ricerca per vicinanze:', err);
                    // Fallback a tutti i ristoranti in caso di errore
                    restaurants = await restaurantDao.getAllRestaurants();
                }
            } else {
                // coordinate non valide -> fallback
                restaurants = await restaurantDao.getAllRestaurants();
            }
        } else if (q && q.trim() !== '') {
            // ricerca testuale: utilizziamo il DAO di ricerca
            try {
                restaurants = await restaurantDao.searchRestaurants(q.trim());
            } catch (err) {
                console.error('Errore durante la ricerca testuale:', err);
                restaurants = await restaurantDao.getAllRestaurants();
            }
        } else {
            restaurants = await restaurantDao.getAllRestaurants();
        }

        res.render('restaurants', {
            title: 'Ristoranti - Speedy',
            restaurants,
            nearby: nearbyActive,
            nearbyInfo,
            query: q || ''
        });
    } catch (err) {
        console.error(err);
        res.render('restaurants', {
            title: 'Ristoranti - Speedy',
            restaurants: [],
            error: 'Errore nel caricamento',
            query: req.query.q || ''
        });
    }
});

// DETTAGLIO RISTORANTE + MENU
router.get('/restaurant/:id', async (req, res) => {
    try {
        const restaurant = await restaurantDao.getRestaurantById(req.params.id);
        
        if (!restaurant) {
            return res.status(404).render('error', {
                title: 'Errore - Speedy',
                error: 'Ristorante non trovato',
                status: 404
            });
        }

        const menuItems = await menuDao.getMenuByRestaurant(req.params.id);
        const reviews = await reviewDao.getReviewsByRestaurant(req.params.id);

        res.render('restaurant-detail', {
            title: `${restaurant.name} - Speedy`,
            restaurant,
            menuItems,
            reviews
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            title: 'Errore - Speedy',
            error: 'Errore nel caricamento',
            status: 500
        });
    }
});

// ORDINI DEL CLIENTE
router.get('/orders', isCustomer, async (req, res) => {
    try {
        const orders = await orderDao.getOrdersByCustomer(req.user.id);
        res.render('orders', {
            title: 'I miei ordini - Speedy',
            orders
        });
    } catch (err) {
        console.error(err);
        res.render('orders', {
            title: 'I miei ordini - Speedy',
            orders: [],
            error: 'Errore nel caricamento degli ordini'
        });
    }
});

// DASHBOARD RISTORATORE
router.get('/dashboard', isRestaurant, async (req, res) => {
    try {
        const restaurants = await restaurantDao.getRestaurantsByOwner(req.user.id);
        
        res.render('dashboard', {
            title: 'Dashboard - Speedy',
            restaurants
        });
    } catch (err) {
        console.error(err);
        res.render('dashboard', {
            title: 'Dashboard - Speedy',
            restaurants: [],
            error: 'Errore nel caricamento'
        });
    }
});

// LOGIN PAGE
router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('login', {
        title: 'Login - Speedy',
        error: null
    });
});

// REGISTER PAGE
router.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('register', {
        title: 'Registrati - Speedy',
        error: null
    });
});

// ADMIN PANEL
router.get('/admin', isAdmin, async (req, res) => {
    try {
        const stats = {
            totalUsers: await userDao.countUsers(),
            totalRestaurants: await restaurantDao.countRestaurants(),
            totalOrders: await orderDao.countOrders(),
            totalRevenue: await orderDao.getTotalRevenue()
        };

    const users = await userDao.getAllUsers();
    const restaurants = await restaurantDao.getAllRestaurantsAdmin();
        const reviews = await reviewDao.getAllReviews();

        res.render('admin', {
            title: 'Admin Panel - Speedy',
            stats,
            users,
            restaurants,
            reviews
        });
    } catch (err) {
        console.error(err);
        res.render('admin', {
            title: 'Admin Panel - Speedy',
            stats: { totalUsers: 0, totalRestaurants: 0, totalOrders: 0, totalRevenue: 0 },
            users: [],
            restaurants: [],
            reviews: [],
            error: 'Errore nel caricamento dei dati'
        });
    }
});

module.exports = router;