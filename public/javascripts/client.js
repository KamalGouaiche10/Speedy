'use strict';

(function() {
    // CARRELLO - incapsulato nel modulo
    let cart = [];

    // Inizializzazione quando il DOM è pronto
    document.addEventListener('DOMContentLoaded', () => {
        initializeCart();
        initializeFilters();
        initializeSearch();
        initializeGeolocation();
        initializeHeroSearch();
    });

    //CARRELLO 
    function initializeCart() {
        const addButtons = document.querySelectorAll('.add-to-cart');
        
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(btn.dataset.id);
                const name = btn.dataset.name;
                const price = parseFloat(btn.dataset.price);
                
                addToCart(id, name, price);
            });
        });

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckout);
        }

        // Gestisci i bottoni nel carrello con event delegation
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                const action = target.dataset.action;
                const itemId = parseInt(target.dataset.itemId);

                if (action === 'increase') {
                    updateQuantity(itemId, 1);
                } else if (action === 'decrease') {
                    updateQuantity(itemId, -1);
                } else if (action === 'remove') {
                    removeFromCart(itemId);
                }
            });
        }
    }

    function addToCart(id, name, price) {
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        
        updateCartDisplay();
        showToast('Prodotto aggiunto al carrello!');
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartDisplay();
    }

    function updateQuantity(id, change) {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartDisplay();
        }
    }

    function updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartFooter = document.getElementById('cart-footer');
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItemsContainer) return;
        
        cartCount.textContent = cart.length;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-cart-x icon-lg"></i>
                    <p class="mt-2">Il carrello è vuoto</p>
                </div>
            `;
            cartFooter.classList.add('d-none');
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                <div class="flex-grow-1">
                    <strong>${escapeHtml(item.name)}</strong>
                    <div class="text-muted small">€ ${item.price.toFixed(2)} x ${item.quantity}</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary" data-action="decrease" data-item-id="${item.id}">
                        <i class="bi bi-dash"></i>
                    </button>
                    <span class="fw-bold">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary" data-action="increase" data-item-id="${item.id}">
                        <i class="bi bi-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="remove" data-item-id="${item.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        cartTotal.textContent = `€ ${total.toFixed(2)}`;
        cartFooter.classList.remove('d-none');
    }

    async function handleCheckout() {
        const checkoutBtn = document.getElementById('checkout-btn');
        const restaurantId = checkoutBtn.dataset.restaurantId;
        
        if (cart.length === 0) {
            alert('Il carrello è vuoto');
            return;
        }
        
        const address = prompt('Inserisci l\'indirizzo di consegna:');
        if (!address) return;
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderItems = cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.price
        }));
        
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId: parseInt(restaurantId),
                    items: orderItems,
                    totalPrice: total,
                    deliveryAddress: address,
                    notes: ''
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nella creazione dell\'ordine');
            }
            
            alert('Ordine effettuato con successo!');
            cart = [];
            updateCartDisplay();
            window.location.href = '/orders';
            
        } catch (err) {
            alert('Errore: ' + err.message);
        }
    }

    //FILTRI E RICERCA
    function initializeFilters() {
        const sortSelect = document.getElementById('sort-select');
        const ratingFilter = document.getElementById('rating-filter');
        const statusFilter = document.getElementById('filter-status');
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                sortRestaurants(e.target.value);
            });
        }
        
        if (ratingFilter) {
            ratingFilter.addEventListener('change', (e) => {
                filterByRating(parseFloat(e.target.value));
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                filterOrdersByStatus(e.target.value);
            });
        }
    }

    function sortRestaurants(sortBy) {
        const container = document.getElementById('restaurants-list');
        if (!container) return;
        
        const items = Array.from(container.querySelectorAll('.restaurant-item'));
        
        items.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.dataset.name.localeCompare(b.dataset.name);
                case 'rating':
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                case 'recent':
                    return new Date(b.dataset.date) - new Date(a.dataset.date);
                default:
                    return 0;
            }
        });
        
        items.forEach(item => container.appendChild(item));
    }

    function filterByRating(minRating) {
        const items = document.querySelectorAll('.restaurant-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            const rating = parseFloat(item.dataset.rating);
            if (rating >= minRating) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    function filterOrdersByStatus(status) {
        const orders = document.querySelectorAll('.order-card');
        
        orders.forEach(order => {
            if (!status || order.dataset.status === status) {
                order.style.display = '';
            } else {
                order.style.display = 'none';
            }
        });
    }

    // RICERCA 
    function initializeSearch() {
        const searchMenu = document.getElementById('search-menu');
        
        if (searchMenu) {
            searchMenu.addEventListener('input', (e) => {
                searchMenuItems(e.target.value.toLowerCase());
            });
        }
    }

    function searchMenuItems(query) {
        const items = document.querySelectorAll('.menu-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            const name = item.dataset.name || '';
            const category = item.dataset.category || '';
            
            if (name.includes(query) || category.includes(query)) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
    }

    // HERO SEARCH
    function initializeHeroSearch() {
        const heroSearchBtn = document.getElementById('heroSearchBtn');
        const heroSearch = document.getElementById('heroSearch');
        
        if (heroSearchBtn) {
            heroSearchBtn.addEventListener('click', () => {
                performHeroSearch();
            });
        }
        
        if (heroSearch) {
            heroSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performHeroSearch();
                }
            });
        }
    }

    function performHeroSearch() {
        const searchQuery = document.getElementById('heroSearch').value.trim();
        if (searchQuery) {
            window.location.href = `/restaurants?q=${encodeURIComponent(searchQuery)}`;
        } else {
            window.location.href = '/restaurants';
        }
    }

    //  GEOLOCALIZZAZIONE 
    function initializeGeolocation() {
        const nearbyBtn = document.getElementById('nearby-btn');
        
        if (nearbyBtn) {
            nearbyBtn.addEventListener('click', searchNearby);
        } else {
            // Nel caso il bottone non esista (pagine diverse), non fare nulla
            return;
        }
    }

    async function searchNearby() {
        if (!('geolocation' in navigator)) {
            showToast('Geolocalizzazione non supportata dal browser', 'danger');
            return;
        }

        const btn = document.getElementById('nearby-btn');
        if (!btn) return;

        btn.disabled = true;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ricerca...';

        // Opzioni: alta accuratezza disattivata per risparmiare tempo, timeout 10s, massimo età 30s
        const geoOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 };

        const onErrorReset = (message) => {
            showToast(message, 'danger');
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        };

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const controller = new AbortController();
                const fetchTimeout = setTimeout(() => controller.abort(), 8000);

                const response = await fetch(`/api/restaurants/nearby?lat=${latitude}&lng=${longitude}&radius=10`, { signal: controller.signal });
                clearTimeout(fetchTimeout);

                if (!response.ok) {
                    const errText = await response.text().catch(() => response.statusText);
                    throw new Error(errText || 'Errore nella ricerca');
                }

                // Se vogliamo mostrare i risultati sulla pagina, reindirizziamo con query params
                window.location.href = `/restaurants?nearby=true&lat=${latitude}&lng=${longitude}`;

            } catch (err) {
                if (err.name === 'AbortError') {
                    onErrorReset('Richiesta scaduta. Riprovare');
                } else {
                    onErrorReset('Errore nella ricerca: ' + (err.message || err));
                }
            }
        }, (error) => {
            // Mappa errori geolocation
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    onErrorReset('Permesso geolocalizzazione negato');
                    break;
                case error.POSITION_UNAVAILABLE:
                    onErrorReset('Posizione non disponibile');
                    break;
                case error.TIMEOUT:
                    onErrorReset('Timeout nel recupero della posizione');
                    break;
                default:
                    onErrorReset('Errore nel recupero della posizione: ' + error.message);
            }
        }, geoOptions);
    }

    //UTILITY

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type = 'success') {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '11';
        
        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        document.body.appendChild(toastContainer);
        
        const toastElement = toastContainer.querySelector('.toast');
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }
})();