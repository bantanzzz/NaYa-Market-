// 🔸 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // 🔸 Check if user is authenticated and redirect to vendor dashboard
  onAuthStateChanged(auth, (user) => {
    // We don't need to redirect authenticated users from the main page
    // This check is just to demonstrate how it would work
  });

  // Category filter logic
  const categoryButtons = document.querySelectorAll('.category-btn');
  const vendorCards = document.querySelectorAll('.vendor-card');
  let allVendorCards = [...vendorCards]; // Copy existing cards

  // Load vendor products from Firebase Firestore
  async function loadVendorProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, "vendors"));
      const vendorsContainer = document.getElementById('vendors');
      
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        const card = document.createElement('div');
        card.className = 'vendor-card bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition';
        card.setAttribute('data-category', product.category);
        
        // Determine color based on category
        let colorClass = 'green';
        if (product.category === 'Fashion') colorClass = 'pink';
        else if (product.category === 'Electronics') colorClass = 'blue';
        else if (product.category === 'Food') colorClass = 'yellow';
        
        card.innerHTML = `
          <img src="${product.image}" alt="Product" class="w-28 h-28 object-cover rounded-full mb-4 border-4 border-${colorClass}-100 shadow">
          <h2 class="text-xl font-bold mb-1 text-${colorClass}-700">${product.name}</h2>
          <p class="text-gray-500 mb-1 text-sm">${product.category} <span class="mx-1">•</span> ${product.location}</p>
          <p class="text-gray-500 mb-1 text-sm">Le ${product.price}</p>
          <p class="text-gray-600 text-sm mb-2 hidden description">${product.description || ''}</p>
          <button class="text-green-600 text-sm font-medium mb-2 show-description">Show Description</button>
          <a href="https://wa.me/${product.whatsapp}?text=I'm%20interested%20in%20buying%20${product.name}%20priced%20at%20Le%20${product.price}" target="_blank" class="mt-2 bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 transition shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" /></svg>
            Buy Now
          </a>
          <a href="https://wa.me/${product.whatsapp}" target="_blank" class="mt-3 bg-${colorClass}-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-${colorClass}-600 transition shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.72 11.06a6.5 6.5 0 10-5.66 5.66l2.12-2.12a1 1 0 01.7-.29h.01a1 1 0 01.7.29l2.12 2.12a6.5 6.5 0 00.01-5.66z" /></svg>
            WhatsApp
          </a>
        `;
        
        vendorsContainer.appendChild(card);
        allVendorCards.push(card);
      });
    } catch (error) {
      console.error("Error loading products from Firebase: ", error);
      // Fallback to localStorage if Firebase fails
      const savedProducts = localStorage.getItem('vendorProducts');
      if (savedProducts) {
        const vendorProducts = JSON.parse(savedProducts);
        const vendorsContainer = document.getElementById('vendors');
        
        vendorProducts.forEach((product, index) => {
          const card = document.createElement('div');
          card.className = 'vendor-card bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition';
          card.setAttribute('data-category', product.category);
          
          // Determine color based on category
          let colorClass = 'green';
          if (product.category === 'Fashion') colorClass = 'pink';
          else if (product.category === 'Electronics') colorClass = 'blue';
          else if (product.category === 'Food') colorClass = 'yellow';
          
          card.innerHTML = `
            <img src="${product.image}" alt="Product" class="w-28 h-28 object-cover rounded-full mb-4 border-4 border-${colorClass}-100 shadow">
            <h2 class="text-xl font-bold mb-1 text-${colorClass}-700">${product.name}</h2>
            <p class="text-gray-500 mb-1 text-sm">${product.category} <span class="mx-1">•</span> ${product.location}</p>
            <p class="text-gray-500 mb-1 text-sm">Le ${product.price}</p>
            <p class="text-gray-600 text-sm mb-2 hidden description">${product.description || ''}</p>
            <button class="text-green-600 text-sm font-medium mb-2 show-description">Show Description</button>
            <a href="https://wa.me/${product.whatsapp}?text=I'm%20interested%20in%20buying%20${product.name}%20priced%20at%20Le%20${product.price}" target="_blank" class="mt-2 bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 transition shadow">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" /></svg>
              Buy Now
            </a>
            <a href="https://wa.me/${product.whatsapp}" target="_blank" class="mt-3 bg-${colorClass}-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-${colorClass}-600 transition shadow">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.72 11.06a6.5 6.5 0 10-5.66 5.66l2.12-2.12a1 1 0 01.7-.29h.01a1 1 0 01.7.29l2.12 2.12a6.5 6.5 0 00.01-5.66z" /></svg>
              WhatsApp
            </a>
          `;
          
          vendorsContainer.appendChild(card);
          allVendorCards.push(card);
        });
      }
    }
  }

  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-category');
      categoryButtons.forEach(b => b.classList.remove('ring', 'ring-2', 'ring-offset-2'));
      btn.classList.add('ring', 'ring-2', 'ring-offset-2');
      
      // Trigger search to apply both category and search filters
      searchInput.dispatchEvent(new Event('input'));
    });
  });

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = document.querySelector('.category-btn.ring')?.getAttribute('data-category') || 'All';
    
    allVendorCards.forEach(card => {
      const name = card.querySelector('h2')?.textContent.toLowerCase() || '';
      const category = card.getAttribute('data-category').toLowerCase();
      const location = card.querySelector('p')?.textContent.toLowerCase() || '';
      
      const matchesSearch = searchTerm === '' ||
        name.includes(searchTerm) ||
        category.includes(searchTerm) ||
        location.includes(searchTerm);
        
      const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
      
      if (matchesSearch && matchesCategory) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });

  // Set default to All
  document.querySelector('.category-btn[data-category="All"]').click();

  // Load vendor products
  loadVendorProducts();

  // Description toggle functionality
  function toggleDescription() {
    const descriptions = document.querySelectorAll('.description');
    const buttons = document.querySelectorAll('.show-description');
    
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const description = descriptions[index];
        if (description.classList.contains('hidden')) {
          description.classList.remove('hidden');
          button.textContent = 'Hide Description';
        } else {
          description.classList.add('hidden');
          button.textContent = 'Show Description';
        }
      });
    });
  }

  // Call toggleDescription after products are loaded
  setTimeout(toggleDescription, 1000);
});