/**
 * WF World - UI Helper Functions
 * Common UI interactions and utilities
 */

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    // Find or create alert container
    let container = document.getElementById('alert-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alert-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '10000';
        container.style.maxWidth = '400px';
        document.body.appendChild(container);
    }

    container.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

/**
 * Show loading overlay
 */
function showLoading(message = 'جاري التحميل...') {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
    <div style="text-align: center;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--text-secondary);">${message}</p>
    </div>
  `;
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'EGP') {
    const symbols = {
        EGP: 'ج.م',
        USD: '$',
        SAR: 'ر.س',
        AED: 'د.إ',
        EUR: '€'
    };
    return `${amount.toLocaleString('ar-EG')} ${symbols[currency] || currency}`;
}

/**
 * Format date to Arabic
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format datetime to Arabic
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get subscription status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge badge-success">نشط</span>',
        'expiring-soon': '<span class="badge badge-warning">قرب الانتهاء</span>',
        'expired': '<span class="badge badge-danger">منتهي</span>',
        'inactive': '<span class="badge badge-danger">غير نشط</span>'
    };
    return badges[status] || badges['inactive'];
}

/**
 * Validate email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate phone (Egyptian format primarily)
 */
function isValidPhone(phone) {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Check if it's a valid number (10+ digits)
    return /^\+?\d{10,}$/.test(cleaned);
}

/**
 * Confirm action
 */
function confirmAction(message) {
    return confirm(message);
}

/**
 * Generate PDF (placeholder - will need jsPDF library)
 */
function generatePDF(clientCode) {
    showAlert('ميزة توليد PDF قيد التطوير', 'info');
    // TODO: Implement PDF generation with jsPDF
}

/**
 * Export to CSV
 */
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showAlert('لا توجد بيانات للتصدير', 'warning');
        return;
    }

    // Get headers
    const headers = Object.keys(data[0]);

    // Create CSV content
    let csv = headers.join(',') + '\n';
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csv += values.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    showAlert('تم تصدير البيانات بنجاح', 'success');
}

/**
 * Populate select options
 */
function populateSelect(selectElement, options, valueKey = 'value', textKey = 'text') {
    selectElement.innerHTML = '<option value="">-- اختر --</option>';
    options.forEach(option => {
        const opt = document.createElement('option');
        if (typeof option === 'string') {
            opt.value = option;
            opt.textContent = option;
        } else {
            opt.value = option[valueKey];
            opt.textContent = option[textKey];
        }
        selectElement.appendChild(opt);
    });
}

/**
 * Setup active navigation
 */
function setupActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navbar-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Add fade-in animation to elements
 */
function animateElements() {
    const elements = document.querySelectorAll('.card, .stat-card');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.classList.add('fade-in');
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

/**
 * Initialize common page functions
 */
function initializePage() {
    setupActiveNav();
    animateElements();
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    if (newTheme === 'light') {
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
    }

    // Save preference
    localStorage.setItem('theme', newTheme);

    // Update toggle button icon
    updateThemeIcon();
}

/**
 * Update theme toggle button icon
 */
function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        const isLight = document.body.classList.contains('light-mode');
        btn.textContent = isLight ? '🌙' : '☀️';
    }
}

/**
 * Load saved theme preference
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    updateThemeIcon();
}

// Run on page load
document.addEventListener('DOMContentLoaded', function () {
    loadTheme();
    initializePage();
});
