'use strict';

let selectedRestaurantId = null;

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    const restaurantSelect = document.getElementById('restaurant-select');
    if (restaurantSelect) {
        restaurantSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                selectedRestaurantId = e.target.value;
                loadOrders(e.target.value);
                loadMenu(e.target.value);
            }
        });
    }
    
    const addMenuBtn = document.getElementById('add-menu-btn');
    if (addMenuBtn) {
        addMenuBtn.addEventListener('click', () => {
            if (!selectedRestaurantId) {
                alert('Seleziona prima un ristorante');
                return;
            }
            openMenuItemModal();
        });
    }
    
    attachRestaurantButtons();
});

// Apri modal per nuovo piatto
function openMenuItemModal(menuItem = null) {
    const modal = new bootstrap.Modal(document.getElementById('menuItemModal'));
    const form = document.getElementById('menu-item-form');
    
    // Reset form
    form.reset();
    document.getElementById('menu-item-id').value = '';
    
    if (menuItem) {
        // Modalità modifica
        document.getElementById('menuItemModalLabel').innerHTML = '<i class="bi bi-pencil me-2"></i>Modifica Piatto';
        document.getElementById('menu-item-id').value = menuItem.id;
        document.getElementById('menu-item-name').value = menuItem.name;
        document.getElementById('menu-item-description').value = menuItem.description || '';
        document.getElementById('menu-item-price').value = menuItem.price;
        document.getElementById('menu-item-category').value = menuItem.category || '';
        document.getElementById('menu-item-image').value = menuItem.image_url || '';
        document.getElementById('menu-item-available').checked = menuItem.available;
    } else {
        // Modalità creazione
        document.getElementById('menuItemModalLabel').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Aggiungi Piatto';
        document.getElementById('menu-item-available').checked = true;
    }
    
    modal.show();
}

// Salva piatto (crea o aggiorna)
async function saveMenuItem() {
    if (!selectedRestaurantId) {
        alert('Errore: nessun ristorante selezionato');
        return;
    }
    
    const id = document.getElementById('menu-item-id').value;
    const name = document.getElementById('menu-item-name').value.trim();
    const description = document.getElementById('menu-item-description').value.trim();
    const price = parseFloat(document.getElementById('menu-item-price').value);
    const category = document.getElementById('menu-item-category').value;
    const imageUrl = document.getElementById('menu-item-image').value.trim();
    const available = document.getElementById('menu-item-available').checked;
    
    // Validazione
    if (!name || !price || isNaN(price) || price <= 0) {
        alert('Compila tutti i campi obbligatori correttamente');
        return;
    }
    
    const data = {
        restaurant_id: parseInt(selectedRestaurantId),
        name,
        description,
        price,
        category,
        image_url: imageUrl,
        available
    };
    
    try {
        const url = id ? `/api/menu/${id}` : '/api/menu';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Errore nel salvataggio');
        }
        
        // Chiudi modal
        bootstrap.Modal.getInstance(document.getElementById('menuItemModal')).hide();
        
        // Mostra messaggio successo
        showToast(id ? 'Piatto aggiornato!' : 'Piatto aggiunto!', 'success');
        
        // Ricarica menu
        loadMenu(selectedRestaurantId);
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Modifica piatto
async function editMenuItem(id) {
    try {
        const response = await fetch(`/api/menu/${id}`);
        if (!response.ok) throw new Error('Piatto non trovato');
        
        const menuItem = await response.json();
        openMenuItemModal(menuItem);
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Elimina piatto
async function deleteMenuItem(id) {
    if (!confirm('Sei sicuro di voler eliminare questo piatto?')) return;
    
    try {
        const response = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
        
        if (!response.ok) {
            throw new Error('Errore nell\'eliminazione');
        }
        
        showToast('Piatto eliminato', 'success');
        
        if (selectedRestaurantId) {
            loadMenu(selectedRestaurantId);
        }
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Carica menu
async function loadMenu(restaurantId) {
    try {
        const response = await fetch(`/api/menu/restaurant/${restaurantId}`);
        
        if (!response.ok) {
            throw new Error('Errore nel caricamento del menù');
        }
        
        const menuItems = await response.json();
        displayMenu(menuItems);
        
    } catch (err) {
        console.error('Errore caricamento menù:', err);
    }
}

// Visualizza menu
function displayMenu(items) {
    const container = document.getElementById('menu-list');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-menu-button-wide text-muted icon-xl"></i>
                <p class="text-muted mt-3">Nessun piatto nel menù. Aggiungine uno!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Prezzo</th>
                        <th>Disponibile</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>
                                <strong>${escapeHtml(item.name)}</strong>
                                <br>
                                <small class="text-muted">${escapeHtml(item.description || '')}</small>
                            </td>
                            <td>${escapeHtml(item.category || '-')}</td>
                            <td class="fw-bold text-success">€ ${parseFloat(item.price).toFixed(2)}</td>
                            <td>
                                <span class="badge bg-${item.available ? 'success' : 'secondary'}">
                                    ${item.available ? 'Sì' : 'No'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" 
                                        onclick="editMenuItem(${item.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" 
                                        onclick="deleteMenuItem(${item.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Attach event listeners ai bottoni ristoranti
function attachRestaurantButtons() {
    document.querySelectorAll('.btn-edit-restaurant').forEach(btn => {
        btn.addEventListener('click', function() {
            editRestaurant(parseInt(this.dataset.id));
        });
    });
    
    document.querySelectorAll('.btn-delete-restaurant').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteRestaurant(parseInt(this.dataset.id));
        });
    });
}

// Carica ordini del ristorante
async function loadOrders(restaurantId) {
    try {
        const response = await fetch(`/api/orders/restaurant/${restaurantId}`);
        
        if (!response.ok) {
            throw new Error('Errore nel caricamento degli ordini');
        }
        
        const orders = await response.json();
        displayOrders(orders);
        updateStats(orders);
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Visualizza ordini
function displayOrders(orders) {
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox text-muted icon-xl"></i>
                <p class="text-muted mt-3">Nessun ordine ricevuto</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="mb-1">Ordine #${order.id}</h5>
                        <p class="text-muted mb-1">
                            <i class="bi bi-person me-1"></i>${escapeHtml(order.customer_name)}
                        </p>
                        <p class="text-muted mb-0">
                            <i class="bi bi-clock me-1"></i>
                            ${new Date(order.created_at).toLocaleString('it-IT')}
                        </p>
                    </div>
                    <span class="badge bg-${getStatusColor(order.status)} fs-6">
                        ${getStatusLabel(order.status)}
                    </span>
                </div>
                
                <p class="mb-2">
                    <i class="bi bi-geo-alt text-danger me-1"></i>
                    ${escapeHtml(order.delivery_address)}
                </p>
                
                <div class="d-flex justify-content-between align-items-center">
                    <strong class="text-success fs-5">€ ${parseFloat(order.total_price).toFixed(2)}</strong>
                    <select class="form-select w-auto" onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>In attesa</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confermato</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>In preparazione</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Pronto</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Consegnato</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annullato</option>
                    </select>
                </div>
            </div>
        </div>
    `).join('');
}

// Aggiorna statistiche
function updateStats(orders) {
    document.getElementById('stat-orders').textContent = orders.length;
    
    const pending = orders.filter(o => o.status === 'pending').length;
    document.getElementById('stat-pending').textContent = pending;
}

// Aggiorna stato ordine
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Errore nell\'aggiornamento');
        }
        
        showToast('Stato aggiornato', 'success');
        
        if (selectedRestaurantId) {
            loadOrders(selectedRestaurantId);
        }
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Salva ristorante
async function saveRestaurant() {
    const id = document.getElementById('restaurant-id').value;
    const data = {
        name: document.getElementById('restaurant-name').value,
        description: document.getElementById('restaurant-description').value,
        address: document.getElementById('restaurant-address').value,
        latitude: parseFloat(document.getElementById('restaurant-lat').value) || null,
        longitude: parseFloat(document.getElementById('restaurant-lng').value) || null,
        image_url: document.getElementById('restaurant-image').value
    };
    
    try {
        const url = id ? `/api/restaurants/${id}` : '/api/restaurants';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Errore nel salvataggio');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('restaurantModal')).hide();
        showToast('Ristorante salvato!', 'success');
        location.reload();
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Modifica ristorante
async function editRestaurant(id) {
    try {
        const response = await fetch(`/api/restaurants/${id}`);
        const restaurant = await response.json();
        
        document.getElementById('restaurant-id').value = restaurant.id;
        document.getElementById('restaurant-name').value = restaurant.name;
        document.getElementById('restaurant-description').value = restaurant.description || '';
        document.getElementById('restaurant-address').value = restaurant.address;
        document.getElementById('restaurant-lat').value = restaurant.latitude || '';
        document.getElementById('restaurant-lng').value = restaurant.longitude || '';
        document.getElementById('restaurant-image').value = restaurant.image_url || '';
        
        const modal = new bootstrap.Modal(document.getElementById('restaurantModal'));
        modal.show();
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Elimina ristorante
async function deleteRestaurant(id) {
    if (!confirm('Sei sicuro di voler eliminare questo ristorante?')) return;
    
    try {
        const response = await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
        
        if (!response.ok) {
            throw new Error('Errore nell\'eliminazione');
        }
        
        alert('Ristorante eliminato');
        location.reload();
        
    } catch (err) {
        alert('Errore: ' + err.message);
    }
}

// Utility
function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'confirmed': 'info',
        'preparing': 'primary',
        'ready': 'success',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'In attesa',
        'confirmed': 'Confermato',
        'preparing': 'In preparazione',
        'ready': 'Pronto',
        'delivered': 'Consegnato',
        'cancelled': 'Annullato'
    };
    return labels[status] || status;
}

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

// Rendi funzioni globali
window.updateOrderStatus = updateOrderStatus;
window.saveRestaurant = saveRestaurant;
window.editRestaurant = editRestaurant;
window.deleteRestaurant = deleteRestaurant;
window.saveMenuItem = saveMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.editMenuItem = editMenuItem;