// 🔸 Cart Management System
class CartManager {
  constructor() {
    this.cart = this.loadCartFromStorage();
    this.deliveryFee = 5000; // Le 5,000 delivery fee
    this.serviceFee = 2000;  // Le 2,000 service fee
    this.init();
  }

  init() {
    this.renderCart();
    this.updateOrderSummary();
    this.setupEventListeners();
  }

  // Load cart from localStorage
  loadCartFromStorage() {
    try {
      const savedCart = localStorage.getItem('naya-market-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return [];
    }
  }

  // Save cart to localStorage
  saveCartToStorage() {
    try {
      localStorage.setItem('naya-market-cart', JSON.stringify(this.cart));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  // Add item to cart
  addItem(product, quantity = 1) {
    const existingItem = this.cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        category: product.category,
        location: product.location,
        image: product.image,
        vendorEmail: product.vendorEmail,
        whatsapp: product.whatsapp,
        paymentNumber: product.paymentNumber,
        quantity: quantity
      });
    }
    
    this.saveCartToStorage();
    this.renderCart();
    this.updateOrderSummary();
    this.showCartNotification(product.name);
  }

  // Remove item from cart
  removeItem(itemId) {
    const itemIndex = this.cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
      const item = this.cart[itemIndex];
      
      // Add removing animation
      const cartItemElement = document.querySelector(`[data-item-id="${itemId}"]`);
      if (cartItemElement) {
        cartItemElement.classList.add('removing');
        setTimeout(() => {
          this.cart.splice(itemIndex, 1);
          this.saveCartToStorage();
          this.renderCart();
          this.updateOrderSummary();
        }, 300);
      } else {
        this.cart.splice(itemIndex, 1);
        this.saveCartToStorage();
        this.renderCart();
        this.updateOrderSummary();
      }
    }
  }

  // Update item quantity
  updateQuantity(itemId, newQuantity) {
    const item = this.cart.find(item => item.id === itemId);
    if (item) {
      if (newQuantity <= 0) {
        this.removeItem(itemId);
      } else {
        item.quantity = newQuantity;
        this.saveCartToStorage();
        this.renderCart();
        this.updateOrderSummary();
      }
    }
  }

  // Clear entire cart
  clearCart() {
    this.cart = [];
    this.saveCartToStorage();
    this.renderCart();
    this.updateOrderSummary();
  }

  // Get cart total
  getSubtotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get total with fees
  getTotal() {
    return this.getSubtotal() + this.deliveryFee + this.serviceFee;
  }

  // Render cart items
  renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartDiv = document.getElementById('emptyCart');
    const cartCount = document.getElementById('cartCount');

    if (this.cart.length === 0) {
      cartItemsContainer.innerHTML = '';
      emptyCartDiv.classList.remove('hidden');
      cartCount.textContent = '0';
      return;
    }

    emptyCartDiv.classList.add('hidden');
    cartCount.textContent = this.cart.length.toString();

    cartItemsContainer.innerHTML = this.cart.map(item => `
      <div class="cart-item bg-gray-50 rounded-lg p-4 flex items-center gap-4" data-item-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0" loading="lazy" onerror="this.src='https://via.placeholder.com/64x64?text=Image+Error'">
        
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-gray-800 break-words">${item.name}</h4>
          <p class="text-sm text-gray-500 break-words">${item.category} • ${item.location}</p>
          <p class="text-sm font-medium text-green-600">Le ${item.price.toLocaleString()}</p>
          ${item.vendorEmail ? `<p class="text-xs text-gray-400 break-words">by ${item.vendorEmail}</p>` : ''}
        </div>
        
        <div class="flex flex-col items-end gap-2">
          <div class="flex items-center gap-2">
            <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
              </svg>
            </button>
            <span class="w-8 text-center font-medium">${item.quantity}</span>
            <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </button>
          </div>
          
          <div class="text-right">
            <p class="font-semibold text-gray-800 text-sm">Le ${(item.price * item.quantity).toLocaleString()}</p>
            <button onclick="cartManager.removeItem('${item.id}')" class="text-red-500 hover:text-red-700 text-xs mt-1">
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Update order summary
  updateOrderSummary() {
    const subtotal = this.getSubtotal();
    const total = this.getTotal();

    document.getElementById('subtotal').textContent = `Le ${subtotal.toLocaleString()}`;
    document.getElementById('deliveryFee').textContent = `Le ${this.deliveryFee.toLocaleString()}`;
    document.getElementById('serviceFee').textContent = `Le ${this.serviceFee.toLocaleString()}`;
    document.getElementById('total').textContent = `Le ${total.toLocaleString()}`;
  }

  // Show cart notification
  showCartNotification(productName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <div>
          <p class="font-semibold">Added to cart!</p>
          <p class="text-sm opacity-90">${productName}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white opacity-70 hover:opacity-100 ml-2">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  // Setup event listeners
  setupEventListeners() {
    // Payment method selection
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethods.forEach(method => {
      method.addEventListener('change', (e) => {
        // Update visual state
        document.querySelectorAll('.payment-method').forEach(pm => {
          pm.classList.remove('selected');
        });
        e.target.closest('.payment-method').classList.add('selected');
      });
    });

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.addEventListener('click', () => {
      this.processCheckout();
    });

    // Form validation
    const formInputs = ['customerName', 'customerPhone', 'deliveryAddress'];
    formInputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => {
          this.validateForm();
        });
      }
    });
  }

  // Validate form
  validateForm() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
    const checkoutBtn = document.getElementById('checkoutBtn');

    const isValid = customerName && customerPhone && deliveryAddress && this.cart.length > 0;

    checkoutBtn.disabled = !isValid;
    
    if (isValid) {
      checkoutBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
      checkoutBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    } else {
      checkoutBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
      checkoutBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
    }
  }

  // Process checkout
  async processCheckout() {
    if (this.cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    // Validate phone number (Sierra Leone format)
    if (!this.validateSierraLeonePhone(customerPhone)) {
      alert('Please enter a valid Sierra Leone phone number. Format: 232XXXXXXXX');
      return;
    }

    // Show loading overlay
    document.getElementById('loadingOverlay').classList.remove('hidden');

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Process payment based on selected method
      if (paymentMethod === 'ussd') {
        await this.processUSSD();
      } else if (paymentMethod === 'whatsapp') {
        await this.processWhatsApp();
      }

      // Save order to localStorage for demo purposes
      this.saveOrder({
        customerName,
        customerPhone,
        deliveryAddress,
        paymentMethod,
        items: [...this.cart],
        subtotal: this.getSubtotal(),
        deliveryFee: this.deliveryFee,
        serviceFee: this.serviceFee,
        total: this.getTotal(),
        orderDate: new Date().toISOString()
      });

      // Clear cart
      this.clearCart();

      // Show success modal
      document.getElementById('loadingOverlay').classList.add('hidden');
      document.getElementById('successModal').classList.remove('hidden');

    } catch (error) {
      console.error('Checkout error:', error);
      document.getElementById('loadingOverlay').classList.add('hidden');
      alert('There was an error processing your order. Please try again.');
    }
  }

  // Process USSD payment
  async processUSSD() {
    // Group items by vendor for separate payments
    const vendorGroups = {};
    this.cart.forEach(item => {
      const vendorKey = item.vendorEmail || 'unknown';
      if (!vendorGroups[vendorKey]) {
        vendorGroups[vendorKey] = [];
      }
      vendorGroups[vendorKey].push(item);
    });

    // Process each vendor's items
    for (const [vendorEmail, items] of Object.entries(vendorGroups)) {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const paymentNumber = items[0].paymentNumber;

      if (paymentNumber) {
        // Open USSD for this vendor's total
        this.openUSSD(paymentNumber, totalAmount);
      }
    }
  }

  // Process WhatsApp payment
  async processWhatsApp() {
    // Group items by vendor
    const vendorGroups = {};
    this.cart.forEach(item => {
      const vendorKey = item.vendorEmail || 'unknown';
      if (!vendorGroups[vendorKey]) {
        vendorGroups[vendorKey] = [];
      }
      vendorGroups[vendorKey].push(item);
    });

    // Create WhatsApp messages for each vendor
    for (const [vendorEmail, items] of Object.entries(vendorGroups)) {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const whatsapp = items[0].whatsapp;
      const customerName = document.getElementById('customerName').value.trim();
      const deliveryAddress = document.getElementById('deliveryAddress').value.trim();

      if (whatsapp) {
        const message = this.createWhatsAppMessage(items, totalAmount, customerName, deliveryAddress);
        this.openWhatsApp(whatsapp, message);
      }
    }
  }

  // Create WhatsApp message
  createWhatsAppMessage(items, totalAmount, customerName, deliveryAddress) {
    let message = `🛒 *New Order from NaYa Market*\n\n`;
    message += `*Customer:* ${customerName}\n`;
    message += `*Delivery Address:* ${deliveryAddress}\n\n`;
    message += `*Items:*\n`;
    
    items.forEach(item => {
      message += `• ${item.name} x${item.quantity} = Le ${(item.price * item.quantity).toLocaleString()}\n`;
    });
    
    message += `\n*Total: Le ${totalAmount.toLocaleString()}*\n\n`;
    message += `Please confirm this order and provide delivery details. Thank you!`;
    
    return encodeURIComponent(message);
  }

  // Open USSD payment
  openUSSD(paymentNumber, amount) {
    // Clean the payment number
    let cleanNumber = paymentNumber.replace(/[^\d+]/g, '');
    
    // Remove country code if present (232 for Sierra Leone)
    if (cleanNumber.startsWith('+232')) {
      cleanNumber = cleanNumber.substring(4);
    } else if (cleanNumber.startsWith('232')) {
      cleanNumber = cleanNumber.substring(3);
    }
    
    // Ensure the number is 8 digits
    if (cleanNumber.length !== 8) {
      console.warn('Invalid payment number:', paymentNumber);
      return;
    }
    
    // Format the USSD code: *144*2*vendorNumber*amount#
    const ussdCode = `*144*2*${cleanNumber}*${amount}#`;
    const phoneUrl = `tel:${ussdCode}`;
    
    // Open phone dialer
    const phoneLink = document.createElement('a');
    phoneLink.href = phoneUrl;
    phoneLink.style.display = 'none';
    document.body.appendChild(phoneLink);
    phoneLink.click();
    
    setTimeout(() => {
      if (document.body.contains(phoneLink)) {
        document.body.removeChild(phoneLink);
      }
    }, 1000);
  }

  // Open WhatsApp
  openWhatsApp(phoneNumber, message) {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  // Validate Sierra Leone phone number
  validateSierraLeonePhone(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleanNumber.startsWith('+232')) {
      const mobilePart = cleanNumber.substring(4);
      return /^\d{8}$/.test(mobilePart);
    } else if (cleanNumber.startsWith('232')) {
      const mobilePart = cleanNumber.substring(3);
      return /^\d{8}$/.test(mobilePart);
    }
    
    return false;
  }

  // Save order to localStorage
  saveOrder(orderData) {
    try {
      const orders = JSON.parse(localStorage.getItem('naya-market-orders') || '[]');
      orders.push({
        ...orderData,
        orderId: 'ORD-' + Date.now()
      });
      localStorage.setItem('naya-market-orders', JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }
}

// 🔸 Global functions
function closeSuccessModal() {
  document.getElementById('successModal').classList.add('hidden');
}

// 🔸 Initialize cart manager when DOM is loaded
let cartManager;
document.addEventListener('DOMContentLoaded', () => {
  cartManager = new CartManager();
  
  // Set initial form validation state
  cartManager.validateForm();
  
  console.log('Checkout page initialized');
});

// Make cart manager globally available
window.cartManager = cartManager;
