'use strict';

(function() {
    // Inizializzazione event listeners
    document.addEventListener('DOMContentLoaded', () => {
        attachToggleStatusListeners();
        attachDeleteRestaurantListeners();
        attachDeleteReviewListeners();
        attachDeleteUserListeners();
    });

    //GESTIONE UTENTI
    // Attacca event listeners ai pulsanti elimina utente
    function attachDeleteUserListeners() {
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.dataset.userId);
                deleteUser(userId);
            });
        });
    }

    //Elimina un utente
    async function deleteUser(userId) {
        if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'eliminazione');
            }
            
            showToast('Utente eliminato con successo', 'success');
            setTimeout(() => location.reload(), 1500);
            
        } catch (err) {
            showToast('Errore: ' + err.message, 'danger');
        }
    }

    //GESTIONE RISTORANTI
    //Attacca event listeners ai pulsanti toggle status
    function attachToggleStatusListeners() {
        document.querySelectorAll('.btn-toggle-status').forEach(btn => {
            btn.addEventListener('click', function() {
                // data-restaurant-id in template -> dataset.restaurantId
                const restaurantId = this.dataset.restaurantId;
                const currentStatus = this.dataset.currentStatus;
                const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
                
                toggleRestaurantStatus(restaurantId, newStatus);
            });
        });
    }

    //Blocca o sblocca un ristorante
    async function toggleRestaurantStatus(restaurantId, newStatus) {
        const action = newStatus === 'active' ? 'sbloccare' : 'bloccare';
        
        if (!confirm(`Sei sicuro di voler ${action} questo ristorante?`)) return;
        
        try {
            const response = await fetch(`/api/admin/restaurants/${restaurantId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'aggiornamento');
            }
            
            // Aggiorna UI senza ricaricare la pagina
            updateRestaurantStatusUI(restaurantId, newStatus);
            
            const message = newStatus === 'active' ? 'Ristorante sbloccato' : 'Ristorante bloccato';
            showToast(message, 'success');
            
        } catch (err) {
            showToast('Errore: ' + err.message, 'danger');
        }
    }

    // Aggiorna l'interfaccia dopo il cambio di status 
    function updateRestaurantStatusUI(restaurantId, newStatus) {
        // Aggiorna badge status
        const badge = document.getElementById(`status-badge-${restaurantId}`);
        if (badge) {
            badge.className = `badge bg-${newStatus === 'active' ? 'success' : 'danger'}`;
            badge.textContent = newStatus === 'active' ? 'Attivo' : 'Bloccato';
        }
        
        // Aggiorna pulsante toggle
        const toggleBtn = document.getElementById(`toggle-btn-${restaurantId}`);
        if (toggleBtn) {
            toggleBtn.className = `btn btn-sm btn-${newStatus === 'active' ? 'warning' : 'success'} btn-action btn-toggle-status`;
            toggleBtn.dataset.currentStatus = newStatus;
            toggleBtn.title = newStatus === 'active' ? 'Blocca ristorante' : 'Sblocca ristorante';
            toggleBtn.innerHTML = `<i class="bi bi-${newStatus === 'active' ? 'lock' : 'unlock'}"></i> ${newStatus === 'active' ? 'Blocca' : 'Sblocca'}`;
        }
    }

    // Attacca event listeners ai pulsanti elimina ristorante 
    function attachDeleteRestaurantListeners() {
        document.querySelectorAll('.btn-delete-restaurant').forEach(btn => {
            btn.addEventListener('click', function() {
                const restaurantId = this.dataset.restaurantId;
                deleteRestaurantAdmin(restaurantId);
            });
        });
    }

    //Elimina un ristorante
    async function deleteRestaurantAdmin(restaurantId) {
        if (!confirm('Sei sicuro di voler eliminare questo ristorante? Questa azione eliminerà anche tutti i suoi piatti e ordini.')) return;
        
        try {
            const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'eliminazione');
            }
            
            // Rimuovi la riga dalla tabella
            const row = document.getElementById(`restaurant-row-${restaurantId}`);
            if (row) {
                row.remove();
            }
            
            showToast('Ristorante eliminato con successo', 'success');
            
        } catch (err) {
            showToast('Errore: ' + err.message, 'danger');
        }
    }

    //GESTIONE RECENSIONI 
    //Attacca event listeners ai pulsanti elimina recensione
    function attachDeleteReviewListeners() {
        document.querySelectorAll('.btn-delete-review').forEach(btn => {
            btn.addEventListener('click', function() {
                const reviewId = this.dataset.reviewId;
                // passa il riferimento al bottone così possiamo rimuovere la card dal DOM
                deleteReview(reviewId, this);
            });
        });
    }

    async function deleteReview(reviewId, btnElement) {
        if (!confirm('Sei sicuro di voler eliminare questa recensione?')) return;
        
        try {
            const response = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Errore nell\'eliminazione');
            }
            // Rimuovi la card della recensione dal DOM (se disponibile)
            if (btnElement) {
                const card = btnElement.closest('.card');
                if (card) card.remove();
            }
            showToast('Recensione eliminata con successo', 'success');
            
        } catch (err) {
            showToast('Errore: ' + err.message, 'danger');
        }
    }

    //UTILITY
    function showToast(message, type = 'success') {
        // Rimuovi eventuali toast esistenti
        const existingToasts = document.querySelectorAll('.toast-container');
        existingToasts.forEach(t => t.remove());
        
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        
        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white bg-${type} border-0 show" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                        ${escapeHtml(message)}
                    </div>
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();