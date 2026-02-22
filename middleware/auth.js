'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userDao = require('../models/user-dao');

// Configura strategia locale Passport
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const user = await userDao.getUserByEmail(email);
            if (!user) {
                return done(null, false, { message: 'Email non trovata' });
            }
            
            const isValid = await userDao.checkPassword(user, password);
            if (!isValid) {
                return done(null, false, { message: 'Password errata' });
            }
            
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// Serializza utente in sessione
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserializza utente dalla sessione
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userDao.getUserById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// MIDDLEWARE DI AUTORIZZAZIONE
// Verifica se utente è loggato
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Non autenticato' });
};

// Verifica se utente è admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Accesso negato. Solo admin.' });
};

// Verifica se utente è ristoratore
const isRestaurant = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'restaurant' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ error: 'Accesso negato. Solo ristoratori.' });
};

// Verifica se utente è cliente
const isCustomer = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'customer' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ error: 'Accesso negato. Solo clienti.' });
};

module.exports = {
    passport,
    isLoggedIn,
    isAdmin,
    isRestaurant,
    isCustomer
};