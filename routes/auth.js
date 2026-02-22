'use strict';

const express = require('express');
const router = express.Router();
const { passport, isLoggedIn } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const userDao = require('../models/user-dao');

//Registrazione nuovo utente
router.post('/register',
    // Validatori express-validator
    [
        body('email').isEmail().withMessage('Email non valida').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('La password deve essere almeno 6 caratteri'),
        body('name').notEmpty().withMessage('Nome richiesto').trim().escape(),
        body('role').isIn(['customer', 'restaurant']).withMessage('Ruolo non valido'),
        body('phone').optional({ checkFalsy: true }).isMobilePhone('it-IT').withMessage('Numero di telefono non valido')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            const { email, password, name, role, phone, address } = req.body;

            if (!errors.isEmpty()) {
                // Prendi il primo messaggio come summary e passa l'array per la vista
                const firstError = errors.array()[0];
                return res.render('register', {
                    title: 'Registrati',
                    user: null,
                    error: firstError.msg,
                    validationErrors: errors.array(),
                    formData: { email, name, role, phone, address }
                });
            }

            // Crea utente
            const userId = await userDao.createUser(email, password, name, role, phone, address);

            // Redirect al login con messaggio di successo
            res.render('login', {
                title: 'Accedi',
                user: null,
                email: email,
                success: 'Registrazione completata! Ora puoi effettuare il login.'
            });

        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.render('register', {
                    title: 'Registrati',
                    user: null,
                    error: 'Questa email è già registrata',
                    formData: req.body
                });
            } else {
                return res.render('register', {
                    title: 'Registrati',
                    user: null,
                    error: 'Errore durante la registrazione: ' + err.message,
                    formData: req.body
                });
            }
        }
    }
);

//Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Login error:', err);
            return res.render('login', {
                title: 'Accedi',
                user: null,
                email: req.body.email,
                error: 'Errore del server. Riprova più tardi.'
            });
        }
        
        if (!user) {
            console.log('Login failed:', info);
            // Renderizza la pagina login con messaggio di errore
            return res.render('login', {
                title: 'Accedi',
                user: null,
                email: req.body.email,
                error: info.message || 'Credenziali non valide'
            });
        }
        
        req.login(user, (err) => {
            if (err) {
                console.error('Session error:', err);
                return res.render('login', {
                    title: 'Accedi',
                    user: null,
                    email: req.body.email,
                    error: 'Errore nella creazione della sessione'
                });
            }
            
            console.log('Login successful for:', user.email);
            
            // Redirect in base al ruolo
            if (user.role === 'restaurant') {
                return res.redirect('/dashboard');
            } else if (user.role === 'admin') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/');
            }
        });
    })(req, res, next);
});

//Logout
router.post('/logout', isLoggedIn, (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.redirect('/');
    });
});

// Ottieni utente corrente
router.get('/current', isLoggedIn, (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
});

module.exports = router;