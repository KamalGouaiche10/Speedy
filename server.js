'use strict';

const express = require('express');
const session = require('express-session');
const path = require('path');
const { passport } = require('./middleware/auth');

// Inizializza Express
const app = express();

// CONFIGURAZIONE EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configurazione sessioni
app.use(session({
    secret: process.env.SESSION_SECRET || 'food-delivery-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Inizializza Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware per rendere l'utente disponibile in tutti i template
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ROUTES API 
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const viewRoutes = require('./routes/views');

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/', viewRoutes);

// ERROR HANDLING
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint non trovato' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500);
    
    // Se è una richiesta API, rispondi con JSON
    if (req.path.startsWith('/api/')) {
        res.json({ error: err.message || 'Errore interno del server' });
    } else {
        // Altrimenti renderizza una pagina di errore
        res.render('error', { 
            title: `Errore ${err.status || 500} - Speedy`,
            error: err.message || 'Errore interno del server',
            status: err.status || 500
        });
    }
});

module.exports = app;