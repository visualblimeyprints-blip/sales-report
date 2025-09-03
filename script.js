// Product data
const PRODUCTS = [
    { id: "photocopy_bw", name: "Photocopy (B/W)", unitPrice: 1.00 },
    { id: "photocopy_color", name: "Photocopy (Color)", unitPrice: 1.50 },
    { id: "printing_bw", name: "Printing (B/W)", unitPrice: 1.50 },
    { id: "printing_color", name: "Printing (Color)", unitPrice: 2.00 },
    { id: "lamination_a4", name: "Lamination A4", unitPrice: 5.00 },
    { id: "lamination_a3", name: "Lamination A3", unitPrice: 10.00 },
    { id: "art_paper_bw", name: "Art Paper (B/W)", unitPrice: 2.00 },
    { id: "art_paper_color", name: "Art Paper (Color)", unitPrice: 2.50 },
    { id: "dtf_a3", name: "DTF (A3)", unitPrice: 11.00 },
    { id: "dtf_a4", name: "DTF (A4)", unitPrice: 5.50 }
];

const STORAGE_KEY = "vb_printing_sales";

// Global variables
let sales = [];
let deleteItemId = null;

// DOM elements
const productSelect = document.getElementById('product');
const quantityInput = document.getElementById('quantity');
const totalDisplay = document.getElementById('totalDisplay');
const addSaleBtn = document.getElementById('addSaleBtn');
const totalSalesElement = document.getElementById('totalSales');
const totalRevenueElement = document.getElementById('totalRevenue');
const exportContainer = document.getElementById('exportContainer');
const exportBtn = document.getElementById('exportBtn');
const salesContent = document.getElementById('salesContent');
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    populateProductDropdown();
    loadSalesFromStorage();
    setupEventListeners();
    updateTotal();
    renderSales();
    updateSummary();
}

function populateProductDropdown() {
    productSelect.innerHTML = '<option value="">Select a product</option>';
    
    PRODUCTS.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - GH₵${product.unitPrice.toFixed(2)}`;
        productSelect.appendChild(option);
    });
}

function setupEventListeners() {
    productSelect.addEventListener('change', updateTotal);
    quantityInput.addEventListener('input', updateTotal);
    addSaleBtn.addEventListener('click', addSale);
    exportBtn.addEventListener('click', exportToPDF);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', deleteSale);
    
    // Close modal when clicking outside
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    // Handle Enter key in quantity input
    quantityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !addSaleBtn.disabled) {
            addSale();
        }
    });
}

function updateTotal() {
    const selectedProduct = PRODUCTS.find(p => p.id === productSelect.value);
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (selectedProduct && quantity > 0) {
        const total = selectedProduct.unitPrice * quantity;
        totalDisplay.textContent = `GH₵${total.toFixed(2)}`;
        addSaleBtn.disabled = false;
    } else {
        totalDisplay.textContent = 'GH₵0.00';
        addSaleBtn.disabled = true;
    }
}

function addSale() {
    const selectedProduct = PRODUCTS.find(p => p.id === productSelect.value);
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (!selectedProduct || quantity <= 0) return;
    
    const sale = {
        id: Date.now().toString(),
        product: { ...selectedProduct },
        quantity: quantity,
        total: selectedProduct.unitPrice * quantity,
        date: new Date().toLocaleString()
    };
    
    sales.unshift(sale);
    saveSalesToStorage();
    renderSales();
    updateSummary();
    
    // Reset form
    productSelect.value = '';
    quantityInput.value = '1';
    updateTotal();
    
    // Show success animation
    addSaleBtn.textContent = '✓ Added!';
    addSaleBtn.style.backgroundColor = '#28a745';
    setTimeout(() => {
        addSaleBtn.textContent = 'Add Sale';
        addSaleBtn.style.backgroundColor = '#007bff';
    }, 1000);
}

function renderSales() {
    if (sales.length === 0) {
        showEmptyState();
        exportContainer.style.display = 'none';
        return;
    }
    
    exportContainer.style.display = 'flex';
    
    // Desktop table
    const desktopTable = createDesktopTable();
    
    // Mobile cards
    const mobileCards = createMobileCards();
    
    salesContent.innerHTML = `
        <div class="table-container">
            ${desktopTable}
        </div>
        <div class="mobile-cards">
            ${mobileCards}
        </div>
    `;
    
    // Add event listeners for delete buttons
    setupDeleteButtons();
}

function createDesktopTable() {
    let tableHTML = `
        <table class="sales-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sales.forEach((sale, index) => {
        tableHTML += `
            <tr style="animation-delay: ${index * 100}ms">
                <td>${sale.product.name}</td>
                <td>${sale.quantity}</td>
                <td>GH₵${sale.product.unitPrice.toFixed(2)}</td>
                <td><strong>GH₵${sale.total.toFixed(2)}</strong></td>
                <td class="date-cell">${sale.date}</td>
                <td>
                    <button class="btn btn-danger btn-small delete-btn" data-id="${sale.id}">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    return tableHTML;
}

function createMobileCards() {
    let cardsHTML = '';
    
    sales.forEach((sale, index) => {
        cardsHTML += `
            <div class="mobile-card" style="animation-delay: ${index * 100}ms">
                <div class="mobile-card-header">
                    <h3 class="mobile-card-title">${sale.product.name}</h3>
                    <button class="btn btn-danger btn-small delete-btn" data-id="${sale.id}">
                        🗑️
                    </button>
                </div>
                <div class="mobile-card-details">
                    <div class="mobile-card-row">
                        <span class="label">Quantity:</span>
                        <span class="value">${sale.quantity}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="label">Unit Price:</span>
                        <span class="value">GH₵${sale.product.unitPrice.toFixed(2)}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="label">Total:</span>
                        <span class="value total">GH₵${sale.total.toFixed(2)}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="label">Date:</span>
                        <span class="value">${sale.date}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    return cardsHTML;
}

function setupDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteItemId = this.getAttribute('data-id');
            showDeleteModal();
        });
    });
}

function showEmptyState() {
    salesContent.innerHTML = `
        <div class="empty-state">
            <div class="icon">📦</div>
            <h3>No sales recorded yet</h3>
            <p>Add your first sale using the form above</p>
        </div>
    `;
}

function updateSummary() {
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    totalSalesElement.textContent = totalItems;
    totalRevenueElement.textContent = `GH₵${totalRevenue.toFixed(2)}`;
    
    // Add animation to numbers
    animateNumber(totalSalesElement, totalItems);
    animateValue(totalRevenueElement, totalRevenue, 'GH₵');
}

function animateNumber(element, finalValue) {
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

function animateValue(element, finalValue, prefix = '') {
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

function showDeleteModal() {
    deleteModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    deleteModal.classList.remove('show');
    document.body.style.overflow = 'auto';
    deleteItemId = null;
}

function deleteSale() {
    if (deleteItemId) {
        sales = sales.filter(sale => sale.id !== deleteItemId);
        saveSalesToStorage();
        renderSales();
        updateSummary();
        closeDeleteModal();
        
        // Show success message
        showToast('Sale deleted successfully', 'success');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInLeft 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

function exportToPDF() {
    if (sales.length === 0) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('VB Printing Sales Record', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    // Add summary
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    doc.text(`Total Items Sold: ${totalItems}`, 20, 40);
    doc.text(`Total Revenue: GH₵${totalRevenue.toFixed(2)}`, 20, 50);
    
    // Prepare table data
    const tableData = sales.map(sale => [
        sale.product.name,
        sale.quantity.toString(),
        `GH₵${sale.product.unitPrice.toFixed(2)}`,
        `GH₵${sale.total.toFixed(2)}`,
        sale.date
    ]);
    
    // Add table
    doc.autoTable({
        head: [['Product', 'Quantity', 'Unit Price', 'Total', 'Date']],
        body: tableData,
        startY: 60,
        styles: {
            fontSize: 10,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [0, 123, 255],
            textColor: 255
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        }
    });
    
    // Save the PDF
    doc.save('vb-printing-sales-record.pdf');
    
    // Show success message
    showToast('PDF exported successfully!', 'success');
}

function saveSalesToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showToast('Error saving data', 'error');
    }
}

function loadSalesFromStorage() {
    try {
        const savedSales = localStorage.getItem(STORAGE_KEY);
        if (savedSales) {
            sales = JSON.parse(savedSales);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        showToast('Error loading saved data', 'error');
        sales = [];
    }
}

// Handle page visibility change to save data
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        saveSalesToStorage();
    }
});

// Handle browser close/refresh
window.addEventListener('beforeunload', function() {
    saveSalesToStorage();
});