// 🔸 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, limit, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔸 Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAmo-k0nfZfhHpllglRpG_47hy8xkKHwZk",
  authDomain: "naya-market-dfc44.firebaseapp.com",
  databaseURL: "https://naya-market-dfc44-default-rtdb.firebaseio.com",
  projectId: "naya-market-dfc44",
  storageBucket: "naya-market-dfc44.firebasestorage.app",
  messagingSenderId: "43888035069",
  appId: "1:43888035069:web:c06a7cd0de1732f731aa94",
  measurementId: "G-DBE1VS39RS"
};

// 🔸 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔸 Performance optimizations
let allVendorCards = [];
let currentProducts = [];
let isLoading = false;
let searchTimeout;
let searchResults = [];

// 🔸 Debounced search function for better performance
function debounceSearch(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(searchTimeout);
      func(...args);
    };
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(later, wait);
  };
}

// 🔸 Optimized card creation with DocumentFragment
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'vendor-card bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition';
  card.setAttribute('data-category', product.category);
  card.setAttribute('data-name', product.name.toLowerCase());
  card.setAttribute('data-location', product.location.toLowerCase());
  
  // Determine color based on category
  let colorClass = 'green';
  if (product.category === 'Fashion') colorClass = 'pink';
  else if (product.category === 'Electronics') colorClass = 'blue';
  else if (product.category === 'Food') colorClass = 'yellow';
  
  // Handle both Storage URLs and data URLs for backward compatibility
  const imageSrc = product.image || 'https://via.placeholder.com/112x112?text=No+Image';
  
  // Show vendor info if available
  const vendorInfo = product.vendorEmail ? `<p class="text-xs text-gray-400 mb-1">by ${product.vendorEmail}</p>` : '';
  
  card.innerHTML = `
    <img src="${imageSrc}" alt="Product" class="w-28 h-28 object-cover rounded-full mb-4 border-4 border-${colorClass}-100 shadow" loading="lazy" onerror="this.src='https://via.placeholder.com/112x112?text=Image+Error'">
    ${vendorInfo}
    <h2 class="text-xl font-bold mb-1 text-${colorClass}-700">${product.name}</h2>
    <p class="text-gray-500 mb-1 text-sm">${product.category} <span class="mx-1">•</span> ${product.location}</p>
    <p class="text-gray-500 mb-1 text-sm">Le ${product.price}</p>
    <p class="text-gray-600 text-sm mb-2 hidden description">${product.description || 'No description available'}</p>
    <button class="text-green-600 text-sm font-medium mb-2 show-description hover:text-green-800 transition">Show Description</button>
    <button onclick="openPaymentApp('${product.paymentNumber || ''}')" class="mt-2 bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 transition shadow w-full justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" /></svg>
      Buy Now
    </button>
    <a href="https://wa.me/${product.whatsapp}" target="_blank" class="mt-3 bg-${colorClass}-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-${colorClass}-600 transition shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.72 11.06a6.5 6.5 0 10-5.66 5.66l2.12-2.12a1 1 0 01.7-.29h.01a1 1 0 01.7.29l2.12 2.12a6.5 6.5 0 00.01-5.66z" /></svg>
      WhatsApp
    </a>
  `;
  
  return card;
}

// 🔸 Optimized product rendering with DocumentFragment
function renderProducts(products, container) {
  const fragment = document.createDocumentFragment();
  
  products.forEach(product => {
    const card = createProductCard(product);
    fragment.appendChild(card);
    allVendorCards.push(card);
  });
  
  container.appendChild(fragment);
  
  // Setup description toggles for new cards
  setupDescriptionToggles();
}

// 🔸 Setup description toggle functionality
function setupDescriptionToggles() {
  const descriptions = document.querySelectorAll('.description');
  const buttons = document.querySelectorAll('.show-description');
  
  buttons.forEach((button, index) => {
    // Remove existing event listeners to prevent duplicates
    button.replaceWith(button.cloneNode(true));
  });
  
  // Get fresh references after cloning
  const freshButtons = document.querySelectorAll('.show-description');
  
  freshButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const description = button.parentElement.querySelector('.description');
      if (description.classList.contains('hidden')) {
        description.classList.remove('hidden');
        button.textContent = 'Hide Description';
        button.classList.add('text-red-600');
      } else {
        description.classList.add('hidden');
        button.textContent = 'Show Description';
        button.classList.remove('text-red-600');
      }
    });
  });
}

// 🔸 Load vendor products from Firebase Firestore with pagination
async function loadVendorProducts() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    const vendorsContainer = document.getElementById('vendors');
    
    // Clear existing content
    vendorsContainer.innerHTML = '';
    allVendorCards = [];
    
    // Add loading indicator
    vendorsContainer.innerHTML = '<div class="col-span-full text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div><p class="mt-2 text-gray-600">Loading products...</p></div>';
    
    // Load products without limit for faster access
    const q = query(collection(db, "vendors"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    currentProducts = [];
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      product.id = doc.id;
      currentProducts.push(product);
    });
    
    // Clear loading indicator and render products
    vendorsContainer.innerHTML = '';
    renderProducts(currentProducts, vendorsContainer);
    
    console.log(`Loaded ${currentProducts.length} products from Firebase Storage`);
    
  } catch (error) {
    console.error("Error loading products from Firebase: ", error);
    // Fallback to localStorage if Firebase fails
    const savedProducts = localStorage.getItem('vendorProducts');
    if (savedProducts) {
      const vendorProducts = JSON.parse(savedProducts);
      const vendorsContainer = document.getElementById('vendors');
      vendorsContainer.innerHTML = '';
      allVendorCards = [];
      renderProducts(vendorProducts, vendorsContainer);
    }
  } finally {
    isLoading = false;
  }
}

// 🔸 Real-time database search function
async function performDatabaseSearch(searchTerm) {
  if (!searchTerm.trim()) {
    // If no search term, show all products
    searchResults = currentProducts;
    return;
  }
  
  try {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in current loaded products first (faster)
    searchResults = currentProducts.filter(product => {
      return product.name.toLowerCase().includes(searchLower) ||
             product.category.toLowerCase().includes(searchLower) ||
             product.location.toLowerCase().includes(searchLower) ||
             (product.description && product.description.toLowerCase().includes(searchLower)) ||
             (product.vendorEmail && product.vendorEmail.toLowerCase().includes(searchLower));
    });
    
    // If no results in current products, search database
    if (searchResults.length === 0) {
      console.log('Searching database for:', searchTerm);
      
      // Create a query to search the database
      const searchQuery = query(
        collection(db, "vendors"),
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(searchQuery);
      searchResults = [];
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        product.id = doc.id;
        searchResults.push(product);
      });
      
      // Also search by category and location
      const categoryQuery = query(
        collection(db, "vendors"),
        where("category", "==", searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1))
      );
      
      const categorySnapshot = await getDocs(categoryQuery);
      categorySnapshot.forEach((doc) => {
        const product = doc.data();
        product.id = doc.id;
        if (!searchResults.find(p => p.id === product.id)) {
          searchResults.push(product);
        }
      });
    }
    
    console.log(`Search found ${searchResults.length} results`);
    
  } catch (error) {
    console.error("Error searching database: ", error);
    // Fallback to local search
    searchResults = currentProducts.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return product.name.toLowerCase().includes(searchLower) ||
             product.category.toLowerCase().includes(searchLower) ||
             product.location.toLowerCase().includes(searchLower);
    });
  }
}

// 🔸 Display search results
function displaySearchResults() {
  const vendorsContainer = document.getElementById('vendors');
  const selectedCategory = document.querySelector('.category-btn.ring')?.getAttribute('data-category') || 'All';
  
  // Filter by category if one is selected
  let filteredResults = searchResults;
  if (selectedCategory !== 'All') {
    filteredResults = searchResults.filter(product => 
      product.category === selectedCategory
    );
  }
  
  // Clear and render filtered results
  vendorsContainer.innerHTML = '';
  allVendorCards = [];
  
  if (filteredResults.length === 0) {
    vendorsContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
        <p class="text-gray-500">Try adjusting your search terms or category filter</p>
      </div>
    `;
  } else {
    renderProducts(filteredResults, vendorsContainer);
  }
}

// 🔸 Payment app redirect function
function openPaymentApp(paymentNumber) {
  // Direct URL schemes for Maxit and Africell apps
  const maxitUrl = 'maxit://pay';
  const africellUrl = 'africell://pay';
  
  // Alternative URL schemes if the above don't work
  const maxitAltUrl = 'maxit://';
  const africellAltUrl = 'africell://';
  
  // Create a temporary link to test if the app is installed
  const testLink = document.createElement('a');
  testLink.style.display = 'none';
  document.body.appendChild(testLink);
  
  // Try Maxit first with direct pay URL
  testLink.href = maxitUrl;
  testLink.click();
  
  // If Maxit doesn't work, try Africell after a short delay
  setTimeout(() => {
    testLink.href = africellUrl;
    testLink.click();
    
    // If direct pay URLs don't work, try alternative URLs
    setTimeout(() => {
      testLink.href = maxitAltUrl;
      testLink.click();
      
      setTimeout(() => {
        testLink.href = africellAltUrl;
        testLink.click();
        
        // If neither app works, show a message
        setTimeout(() => {
          alert('Please install Maxit or Africell app to make payments, or contact the vendor directly via WhatsApp.');
        }, 1000);
      }, 500);
    }, 500);
  }, 500);
  
  // Clean up
  setTimeout(() => {
    if (document.body.contains(testLink)) {
      document.body.removeChild(testLink);
    }
  }, 3000);
}

// Make function globally available
window.openPaymentApp = openPaymentApp;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // 🔸 Check if user is authenticated and redirect to vendor dashboard
  onAuthStateChanged(auth, (user) => {
    // We don't need to redirect authenticated users from the main page
    // This check is just to demonstrate how it would work
  });

  // Category filter logic
  const categoryButtons = document.querySelectorAll('.category-btn');
  
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-category');
      categoryButtons.forEach(b => b.classList.remove('ring', 'ring-2', 'ring-offset-2'));
      btn.classList.add('ring', 'ring-2', 'ring-offset-2');
      
      // Apply category filter to current search results
      displaySearchResults();
    });
  });

  // 🔸 Optimized search functionality with real-time database search
  const searchInput = document.getElementById('searchInput');
  const debouncedSearch = debounceSearch(async () => {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length === 0) {
      // Show all products when search is empty
      searchResults = currentProducts;
      displaySearchResults();
      return;
    }
    
    // Perform database search
    await performDatabaseSearch(searchTerm);
    
    // Display results
    displaySearchResults();
  }, 300); // 300ms delay for better performance

  searchInput.addEventListener('input', debouncedSearch);

  // Set default to All
  document.querySelector('.category-btn[data-category="All"]').click();

  // Load vendor products immediately
  loadVendorProducts();
});