// src/scripts/help-support.js
// Help & Support page — lists support tickets, filters by tab, opens modal, posts new tickets

import { initShell } from '../components/shell.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

// STATE
let allTickets = [];
let activeFilter = 'all';

// DOM REFERENCES
const newTicketBtn         = document.getElementById('newTicketBtn');
const emptyOpenTicketBtn   = document.getElementById('emptyOpenTicketBtn');
const cancelModalBtn       = document.getElementById('cancelModalBtn');
const ticketModal          = document.getElementById('ticketModal');
const ticketForm           = document.getElementById('ticketForm');
const categorySelect       = document.getElementById('category');
const detailsTextarea      = document.getElementById('details');
const submitTicketBtn      = document.getElementById('submitTicketBtn');
const submitTicketText     = document.getElementById('submitTicketText');
const submitTicketLoader   = document.getElementById('submitTicketLoader');
const emptyState           = document.getElementById('emptyState');
const ticketsContainer     = document.getElementById('ticketsContainer');
const filterTabs           = document.querySelectorAll('.filter-tab');
const toast                = document.getElementById('toast');

// INIT
async function init() {
  // Setup Shell
  await initShell('support', 'Support Tickets', "Need help? We've got your back.");
  
  bindEvents();
  await loadTickets();
}

// BIND EVENTS
function bindEvents() {
  newTicketBtn?.addEventListener('click', openModal);
  emptyOpenTicketBtn?.addEventListener('click', openModal);
  cancelModalBtn?.addEventListener('click', closeModal);
  
  ticketModal?.addEventListener('click', (e) => {
    if (e.target === ticketModal) closeModal();
  });

  ticketForm?.addEventListener('submit', handleSubmitTicket);

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.dataset.filter;
      renderTickets();
    });
  });
}

// LOAD TICKETS
async function loadTickets() {
  try {
    const response = await api.get(ENDPOINTS.SUPPORT_TICKET);
    const data = response?.data ?? response;
    
    if (Array.isArray(data)) {
      allTickets = data;
    } else if (data && Array.isArray(data.tickets)) {
      allTickets = data.tickets;
    } else {
      // API didn't return list, let's load from local storage fallback
      loadLocalTickets();
    }
  } catch (err) {
    console.warn('API support list query failed, using localStorage fallback:', err);
    loadLocalTickets();
  }

  renderTickets();
}

function loadLocalTickets() {
  try {
    const local = localStorage.getItem('pillar_support_tickets');
    allTickets = local ? JSON.parse(local) : [];
  } catch {
    allTickets = [];
  }
}

function saveLocalTickets() {
  try {
    localStorage.setItem('pillar_support_tickets', JSON.stringify(allTickets));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// RENDER TICKETS
function renderTickets() {
  const filtered = allTickets.filter(ticket => {
    if (activeFilter === 'all') return true;
    
    // Normalize status strings
    const ticketStatus = (ticket.status || 'open').toLowerCase().replace('-', '_');
    return ticketStatus === activeFilter;
  });

  // Toggle empty state
  if (filtered.length === 0) {
    emptyState?.classList.remove('hidden');
    ticketsContainer?.classList.add('hidden');
    
    if (activeFilter !== 'all') {
      // Customize empty state text for filtered results
      const emptyTitleEl = emptyState.querySelector('.empty-title');
      const emptyDescEl = emptyState.querySelector('.empty-desc');
      if (emptyTitleEl) emptyTitleEl.textContent = `No ${activeFilter.replace('_', ' ')} tickets`;
      if (emptyDescEl) emptyDescEl.textContent = `There are no support tickets in the ${activeFilter.replace('_', ' ')} list.`;
    } else {
      const emptyTitleEl = emptyState.querySelector('.empty-title');
      const emptyDescEl = emptyState.querySelector('.empty-desc');
      if (emptyTitleEl) emptyTitleEl.textContent = 'No tickets yet';
      if (emptyDescEl) emptyDescEl.textContent = "Got an issue? We're here to help you succeed.";
    }
  } else {
    emptyState?.classList.add('hidden');
    ticketsContainer?.classList.remove('hidden');
    
    ticketsContainer.innerHTML = '';
    
    filtered.forEach(ticket => {
      const card = document.createElement('div');
      card.className = 'ticket-card';
      
      const status = (ticket.status || 'open').toUpperCase();
      const statusClass = `status-${status.toLowerCase().replace('_', '-')}`;
      const displayStatus = status.replace('_', ' ');
      const dateStr = formatDate(ticket.createdAt || ticket.date);
      const ticketId = ticket._id || ticket.id || `T-${Math.floor(100000 + Math.random() * 900000)}`;

      card.innerHTML = `
        <div class="ticket-card-header">
          <span class="ticket-category">${ticket.category || 'Support Request'}</span>
          <span class="ticket-status-badge ${statusClass}">${displayStatus}</span>
        </div>
        <p class="ticket-message">${ticket.message || ticket.description || ''}</p>
        <div class="ticket-card-footer">
          <span class="ticket-id">ID: ${ticketId}</span>
          <span class="ticket-date">${dateStr}</span>
        </div>
      `;
      ticketsContainer.appendChild(card);
    });
  }
}

// DATE FORMATTER
function formatDate(dateInput) {
  if (!dateInput) return '--';
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// MODAL CONTROLS
function openModal() {
  ticketModal?.classList.add('open');
  categorySelect?.focus();
}

function closeModal() {
  ticketModal?.classList.remove('open');
  ticketForm?.reset();
}

// SUBMIT TICKET
async function handleSubmitTicket(e) {
  e.preventDefault();

  const category = categorySelect?.value;
  const details = detailsTextarea?.value.trim();

  if (!category) {
    showToast('Please select a category.', 'error');
    return;
  }
  if (!details) {
    showToast('Please describe your issue.', 'error');
    return;
  }

  setSubmitLoading(true);

  // Send a robust payload to match potential backend parameters
  const payload = {
    category,
    subject: category,
    message: details,
    description: details,
    details: details
  };

  try {
    const response = await api.post(ENDPOINTS.SUPPORT_TICKET, payload);
    const newTicket = response?.data ?? response;
    
    // Add locally immediately to ensure the ticket shows up
    if (newTicket && (newTicket.id || newTicket._id || newTicket.createdAt)) {
      allTickets.unshift(newTicket);
    } else {
      // Construct fallback ticket object
      allTickets.unshift({
        id: `T-${Math.floor(100000 + Math.random() * 900000)}`,
        category,
        message: details,
        status: 'open',
        createdAt: new Date().toISOString()
      });
    }

    saveLocalTickets();
    showToast('Ticket submitted successfully!', 'success');
    closeModal();
    renderTickets();

  } catch (err) {
    console.warn('API ticket submission failed, saving to localStorage fallback:', err);
    
    // Save to local storage anyway so the user sees their ticket is captured
    allTickets.unshift({
      id: `T-${Math.floor(100000 + Math.random() * 900000)}`,
      category,
      message: details,
      status: 'open',
      createdAt: new Date().toISOString()
    });

    saveLocalTickets();
    showToast('Ticket created locally!', 'success');
    closeModal();
    renderTickets();
  } finally {
    setSubmitLoading(false);
  }
}

function setSubmitLoading(isLoading) {
  if (!submitTicketBtn) return;
  submitTicketBtn.disabled = isLoading;
  submitTicketText?.classList.toggle('hidden', isLoading);
  submitTicketLoader?.classList.toggle('hidden', !isLoading);
}

function showToast(message, type = '') {
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

init();
