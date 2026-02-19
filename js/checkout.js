// 🔸 Cart Management System
class CartManager {
  constructor() {
    this.cart = this.loadCartFromStorage();
    this.init();
  }

  init() {
    this.renderCart();
    this.updateOrderSummary();
    this.setupEventListeners();
    this.attachCartEventListeners();
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
        paymentProvider: product.paymentProvider || 'orange',
        paymentAppLink: product.paymentAppLink || '',
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

  // Get total
  getTotal() {
    return this.getSubtotal();
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
      <div class="cart-item bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100" data-item-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0" loading="lazy" onerror="this.src='https://via.placeholder.com/64x64?text=Image+Error'">
        
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-gray-800 break-words">${item.name}</h4>
          <p class="text-sm text-gray-500 break-words">${item.category} • ${item.location}</p>
          <p class="text-sm font-semibold text-green-600">Le ${item.price.toLocaleString()}</p>
          ${item.vendorEmail ? `<p class="text-xs text-gray-400 break-words">by ${item.vendorEmail}</p>` : ''}
        </div>
        
        <div class="flex flex-col items-end gap-2">
          <div class="flex items-center gap-2">
            <button type="button" data-action="decrease" data-item-id="${item.id}" class="quantity-btn w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
              </svg>
            </button>
            <span class="w-8 text-center font-semibold text-gray-800">${item.quantity}</span>
            <button type="button" data-action="increase" data-item-id="${item.id}" class="quantity-btn w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </button>
          </div>
          
          <div class="text-right">
            <p class="font-bold text-gray-800 text-sm">Le ${(item.price * item.quantity).toLocaleString()}</p>
            <button type="button" data-action="remove" data-item-id="${item.id}" class="remove-btn text-red-500 hover:text-red-600 text-xs mt-1 cursor-pointer font-medium">
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Update order summary
  updateOrderSummary() {
    // Total is the sum of all items in the cart
    const total = this.getTotal();
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

  // Attach event listeners to cart item buttons
  attachCartEventListeners() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    // Use event delegation for dynamic buttons
    cartItemsContainer.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const itemId = target.getAttribute('data-item-id');

      if (!itemId) return;

      const item = this.cart.find(item => item.id === itemId);
      if (!item) return;

      switch (action) {
        case 'increase':
          this.updateQuantity(itemId, item.quantity + 1);
          break;
        case 'decrease':
          this.updateQuantity(itemId, item.quantity - 1);
          break;
        case 'remove':
          this.removeItem(itemId);
          break;
      }
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Checkout button - automatically dials vendor payment numbers
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.processCheckout();
      });
    }

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

    // Validate phone number (Sierra Leone format)
    if (!this.validateSierraLeonePhone(customerPhone)) {
      alert('Please enter a valid Sierra Leone phone number. Format: 232XXXXXXXX');
      return;
    }

    // Check if vendor payment numbers exist
    const hasPaymentNumbers = this.cart.some(item => item.paymentNumber);
    if (!hasPaymentNumbers) {
      alert('No payment number available for vendors. Please contact vendors directly via WhatsApp.');
      return;
    }

    // Save order to localStorage first
    this.saveOrder({
      customerName,
      customerPhone,
      deliveryAddress,
      paymentMethod: 'mobile-money',
      items: [...this.cart],
      subtotal: this.getSubtotal(),
      total: this.getTotal(),
      orderDate: new Date().toISOString()
    });

    // Automatically dial vendor payment numbers for mobile money
    // Group items by vendor and dial each vendor's payment number
    this.processMobileMoneyPayment();

    // Clear cart
    this.clearCart();

    // Show success modal
    document.getElementById('successModal').classList.remove('hidden');
  }

  // Process Mobile Money Payment - Auto-dial vendor numbers
  processMobileMoneyPayment() {
    // Group items by vendor for separate payments
    const vendorGroups = {};
    this.cart.forEach(item => {
      const vendorKey = item.vendorEmail || 'unknown';
      if (!vendorGroups[vendorKey]) {
        vendorGroups[vendorKey] = [];
      }
      vendorGroups[vendorKey].push(item);
    });

    const groups = Object.entries(vendorGroups).map(([vendorEmail, items]) => ({ vendorEmail, items }));
    if (groups.length === 0) return;

    // Mobile browsers usually block multiple automatic navigations.
    // We open ONLY the first vendor payment app/link from the user click.
    if (groups.length > 1) {
      alert('Your cart contains items from multiple vendors. We will open payment for the first vendor now. After paying, come back and pay the next vendor.');
    }

    const first = groups[0];
    const items = first.items;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const paymentNumber = items[0].paymentNumber;
    const provider = items[0].paymentProvider || 'orange';
    const appLink = items[0].paymentAppLink || '';

    if (paymentNumber) {
      this.openMobileMoneyAppFirst(paymentNumber, totalAmount, provider, appLink);
    }
  }

  // Try to open the mobile money app first; fall back to USSD (optional)
  openMobileMoneyAppFirst(paymentNumber, amount, provider, paymentAppLink) {
    // If vendor provided a payment app link/deep-link, try it first.
    // If the app is not installed or link fails, fall back to USSD.
    if (paymentAppLink && typeof paymentAppLink === 'string' && paymentAppLink.trim().length > 0) {
      const appUrl = paymentAppLink.trim();
      const fallbackUrl = this.buildUSSDTelUrl(paymentNumber, amount, provider);
      if (fallbackUrl) {
        this.openUrlWithFallback(appUrl, fallbackUrl, 1500);
      } else {
        window.location.href = appUrl;
      }
      return;
    }

    // No app link provided → go straight to USSD
    const fallbackUrl = this.buildUSSDTelUrl(paymentNumber, amount, provider);
    if (fallbackUrl) {
      this.createPhoneLink(fallbackUrl);
    } else {
      // Final fallback: dial the raw number
      this.createPhoneLink(`tel:${paymentNumber}`);
    }
  }

  // Build a tel: URL for USSD based on provider (optional fallback)
  buildUSSDTelUrl(paymentNumber, amount, provider) {
    let cleanNumber = (paymentNumber || '').toString().replace(/[^\d+]/g, '');

    // Remove country code if present (232 for Sierra Leone)
    if (cleanNumber.startsWith('+232')) {
      cleanNumber = cleanNumber.substring(4);
    } else if (cleanNumber.startsWith('232')) {
      cleanNumber = cleanNumber.substring(3);
    }

    if (cleanNumber.length !== 8) return null;

    const amt = Math.round(Number(amount) || 0);

    // NOTE: Orange template matches what you were already using.
    if (provider === 'orange') {
      const ussdCode = `*144*2*${cleanNumber}*${amt}#`;
      return `tel:${ussdCode}`;
    }

    // NOTE: This Afrimoney template may differ depending on the real Afrimoney menu.
    // Keep USSD optional: vendors can provide an app link to open My Africell directly.
    if (provider === 'africell') {
      const ussdCode = `*161*2*${cleanNumber}*${amt}#`;
      return `tel:${ussdCode}`;
    }

    return null;
  }

  // Open app URL, and if it doesn't open, fall back after timeout (mobile-friendly pattern)
  openUrlWithFallback(appUrl, fallbackUrl, timeoutMs = 1500) {
    let didHide = false;

    const onVis = () => {
      if (document.hidden) didHide = true;
    };

    document.addEventListener('visibilitychange', onVis, { passive: true });

    const timer = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVis);
      if (!didHide) {
        window.location.href = fallbackUrl;
      }
    }, timeoutMs);

    try {
      window.location.href = appUrl;
    } catch (e) {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.location.href = fallbackUrl;
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

  // Open Mobile Money Dial - Auto-dial vendor payment number
  openMobileMoneyDial(paymentNumber, amount) {
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
      // Fallback: try to dial the number directly
      const phoneUrl = `tel:${paymentNumber}`;
      this.createPhoneLink(phoneUrl);
      return;
    }
    
    // Format the USSD code for Orange Money: *144*2*vendorNumber*amount#
    const ussdCode = `*144*2*${cleanNumber}*${Math.round(amount)}#`;
    const phoneUrl = `tel:${ussdCode}`;
    
    // Open phone dialer automatically
    this.createPhoneLink(phoneUrl);
    
    // Also show an alert to inform user
    console.log(`Dialing mobile money payment: ${ussdCode}`);
  }

  // Helper function to create and click phone link
  createPhoneLink(phoneUrl) {
    const phoneLink = document.createElement('a');
    phoneLink.href = phoneUrl;
    phoneLink.style.display = 'none';
    document.body.appendChild(phoneLink);
    
    // Trigger click to open phone dialer
    phoneLink.click();
    
    // Clean up after a short delay
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
  
  // Make cart manager globally available
  window.cartManager = cartManager;
  
  console.log('Checkout page initialized');
});
