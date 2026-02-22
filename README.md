# Speedy - Food Delivery Platform

Una piattaforma moderna per la consegna di cibo online con gestione ristoranti, ordini e clienti.

## Istruzioni per Esecuzione Locale

### Installazione Dipendenze

Nella cartella del progetto esegui:

```bash
npm install
npm start
```

Successivamente, apri Chrome/Firefox e accedi a `http://localhost:3000`.

## Librerie Utilizzate

- **[express](https://www.npmjs.com/package/express)** - Framework web per Node.js
- **[ejs](https://www.npmjs.com/package/ejs)** - Template engine JavaScript
- **[sqlite3](https://www.npmjs.com/package/sqlite3)** - Database SQLite
- **[express-session](https://www.npmjs.com/package/express-session)** - Gestione sessioni
- **[passport](https://www.npmjs.com/package/passport)** - Autenticazione
- **[passport-local](https://www.npmjs.com/package/passport-local)** - Strategie di autenticazione locale
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Hashing password
- **[bootstrap](https://www.npmjs.com/package/bootstrap)** - Framework CSS/UI
- **[nodemon](https://www.npmjs.com/package/nodemon)** - DevDependency per sviluppo

## Tipi di Utente

### 👨‍💼 Admin
**Descrizione**: Amministratore del sistema con accesso completo

**Autorizzazioni**:
- Gestione completa di tutti i ristoranti
- Visualizzazione e gestione di tutti gli ordini
- Gestione degli utenti
- Statistiche e report
- Accesso al panel amministrativo

### 🏪 Ristorante
**Descrizione**: Gestore di un ristorante con accesso limitato

**Autorizzazioni**:
- Gestione del proprio menu (piatti, categorie, prezzi)
- Visualizzazione degli ordini ricevuti
- Aggiornamento dello stato degli ordini
- Gestione del profilo del ristorante
- Visualizzazione delle recensioni ricevute
- Accesso alla dashboard ristorante

### 👤 Cliente
**Descrizione**: Utente finale che acquista cibo online

**Autorizzazioni**:
- Visualizzazione catalogo ristoranti
- Ricerca e filtro ristoranti per categoria
- Visualizzazione menu e dettagli piatti
- Creazione e gestione del carrello
- Effettuazione ordini
- Visualizzazione cronologia ordini
- Aggiunta di recensioni e valutazioni
- Gestione del proprio profilo

## Credenziali Utente per Test

### Admin
```
Email: admin@fooddelivery.com
Password: admin123
```
**Accesso**: Panel amministrativo completo, gestione sistema

### Ristorante (Esempio)
```
Email: ristorante@test.com
Password: risto123
```
**Accesso**: Dashboard ristorante, gestione menu e ordini

### Cliente (Esempio)
```
Email: cliente@test.com
Password: cliente123
```
**Accesso**: Visualizzazione ristoranti, effettuazione ordini, recensioni

## Struttura del Progetto

```
speedy/
├── bin/                    # Script di avvio
├── database/               # Configurazione e schema DB
├── middleware/             # Middleware personalizzati
├── models/                 # DAO e modelli dati
├── public/                 # File statici
│   ├── images/            # Immagini
│   ├── javascripts/       # Script frontend
│   └── stylesheets/       # Stili CSS
├── routes/                # Definizione rotte
├── views/                 # Template EJS
│   ├── layouts/          # Layout principali
│   └── partials/         # Componenti riutilizzabili
├── server.js             # Entry point
└── package.json          # Dipendenze
```

## Funzionalità Principali

- 🔐 Autenticazione e gestione sessioni
- 🍔 Catalogo ristoranti con menu
- 🛒 Sistema carrello e ordini
- ⭐ Recensioni e valutazioni
- 📊 Dashboard ristorante
- 👨‍💼 Panel admin
- 🔒 Password hashing con bcrypt

## Operazioni Principali

### Per l'Admin
- 📊 Visualizzare statistiche e report di sistema
- 🏪 Gestire tutti i ristoranti registrati
- 📦 Monitorare tutti gli ordini
- 👥 Gestire gli utenti della piattaforma
- ⚙️ Configurazione sistema

### Per il Ristorante
- 📝 Aggiornare menu e piatti
- 💰 Gestire prezzi e categorie
- 📥 Ricevere e gestire ordini
- 📊 Visualizzare ordini completati
- 🏠 Aggiornare informazioni profilo
- ⭐ Visualizzare valutazioni e feedback

### Per il Cliente
- 🔍 Cercare ristoranti per categoria
- 📋 Visualizzare menu e dettagli piatti
- 🛒 Aggiungere articoli al carrello
- ✅ Completare l'ordine
- 📱 Tracciare ordini effettuati
- ⭐ Lasciare recensioni e valutazioni
- 👤 Gestire profilo personale

## API REST

La piattaforma utilizza un'architettura REST con Express.js. Di seguito sono elencati i principali endpoint:

### Autenticazione
- `POST /auth/login` - Login utente
- `POST /auth/register` - Registrazione nuovo utente
- `GET /auth/logout` - Logout utente

### Ristoranti
- `GET /api/restaurants` - Lista di tutti i ristoranti
- `GET /api/restaurants/:id` - Dettagli ristorante specifico
- `POST /api/restaurants` - Creazione nuovo ristorante (admin)
- `PUT /api/restaurants/:id` - Aggiornamento ristorante

### Menu
- `GET /api/menu/:restaurantId` - Menu del ristorante
- `GET /api/menu/:restaurantId/items` - Tutti i piatti del menu
- `POST /api/menu/:restaurantId/items` - Aggiunta piatto (ristorante)
- `PUT /api/menu/:restaurantId/items/:itemId` - Aggiornamento piatto
- `DELETE /api/menu/:restaurantId/items/:itemId` - Eliminazione piatto

### Ordini
- `GET /api/orders` - Lista ordini (filtrato per utente)
- `GET /api/orders/:id` - Dettagli ordine specifico
- `POST /api/orders` - Creazione nuovo ordine
- `PUT /api/orders/:id` - Aggiornamento stato ordine
- `GET /api/orders/restaurant/:restaurantId` - Ordini del ristorante

### Utenti
- `GET /api/users/:id` - Profilo utente
- `PUT /api/users/:id` - Aggiornamento profilo
- `GET /api/users` - Lista utenti (admin)

### Recensioni
- `GET /api/reviews/:restaurantId` - Recensioni ristorante
- `POST /api/reviews` - Aggiunta recensione
- `PUT /api/reviews/:id` - Aggiornamento recensione
- `DELETE /api/reviews/:id` - Eliminazione recensione

## Sviluppo

Per lo sviluppo con hot-reload, le dipendenze includono Nodemon che riavvia il server automaticamente al salvataggio dei file.

## Autore

**Kamal Gouaiche** 