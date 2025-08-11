// 🔸 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔸 Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDXfcM8ClwOJE8Zv6u-N-RuLCxNnjwXuus",
  authDomain: "naya-market-60190.firebaseapp.com",
  projectId: "naya-market-60190",
  storageBucket: "naya-market-60190.firebasestorage.app",
  messagingSenderId: "591341489607",
  appId: "1:591341489607:web:f7b75b28d85d7481869de2"
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // 🔸 Check if user is authenticated
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // User is not authenticated, redirect to login page
      window.location.href = 'login.html';
    }
  });

  const addProductForm = document.getElementById('addProductForm');
  const productList = document.getElementById('productList');
  const noProductsMsg = document.getElementById('noProductsMsg');
  const imageInput = document.getElementById('productImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  let products = [];

  // Load existing products from Firebase
  async function loadProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, "vendors"));
      products = [];
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        product.id = doc.id; // Store document ID for deletion
        products.push(product);
      });
    } catch (error) {
      console.error("Error loading products: ", error);
      // Fallback to localStorage if Firebase fails
      const savedProducts = localStorage.getItem('vendorProducts');
      if (savedProducts) {
        products = JSON.parse(savedProducts);
      }
    }
  }

  // Handle image preview
  imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImg.src = e.target.result;
        imagePreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.classList.add('hidden');
    }
  });

  function renderProducts() {
    productList.innerHTML = '';
    if (products.length === 0) {
      noProductsMsg.style.display = '';
      return;
    }
    noProductsMsg.style.display = 'none';
    products.forEach((product, idx) => {
      const card = document.createElement('div');
      card.className = 'vendor-card bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition';
      card.innerHTML = `
        <img src="${product.image}" alt="Product" class="w-28 h-28 object-cover rounded-full mb-4 border-4 border-green-100 shadow">
        <h2 class="text-xl font-bold mb-1 text-green-700">${product.name}</h2>
        <p class="text-gray-500 mb-1 text-sm">${product.category} <span class="mx-1">•</span> ${product.location}</p>
        <p class="text-gray-500 mb-1 text-sm">Le ${product.price}</p>
        <p class="text-gray-600 text-sm mb-2">${product.description || ''}</p>
        <a href="https://wa.me/${product.whatsapp}?text=I'm%20interested%20in%20buying%20${product.name}%20priced%20at%20Le%20${product.price}" target="_blank" class="mt-2 bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 transition shadow">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" /></svg>
          Buy Now
        </a>
        <a href="https://wa.me/${product.whatsapp}" target="_blank" class="mt-3 bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 transition shadow">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.72 11.06a6.5 6.5 0 10-5.66 5.66l2.12-2.12a1 1 0 01.7-.29h.01a1 1 0 01.7.29l2.12 2.12a6.5 6.5 0 00.01-5.66z" /></svg>
          WhatsApp
        </a>
        <button onclick="deleteProduct(${idx})" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition" title="Delete">
          <svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/></svg>
        </button>
      `;
      productList.appendChild(card);
    });
  }

  addProductForm.onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value.trim();
    const category = document.getElementById('productCategory').value;
    const location = document.getElementById('productLocation').value.trim();
    const whatsapp = document.getElementById('productWhatsApp').value.trim();
    const imageFile = document.getElementById('productImage').files[0];
    
    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    const description = document.getElementById('productDescription').value.trim();
    const reader = new FileReader();
    reader.onload = async function(e) {
      const imageDataUrl = e.target.result;
      const newProduct = { name, price, category, location, whatsapp, description, image: imageDataUrl };
      
      // Save to Firebase
      const saved = await saveProductToFirebase(newProduct);
      if (saved) {
        // Add to local products array for immediate display
        products.push(newProduct);
        renderProducts();
        addProductForm.reset();
        imagePreview.classList.add('hidden');
        alert('Product added successfully! It will appear on the home page.');
      } else {
        // Fallback to localStorage if Firebase fails
        // In this case, we'll store the data URL directly in localStorage
        // This is not ideal for production, but it's a fallback for when Firebase is not available
        let vendorProducts = JSON.parse(localStorage.getItem('vendorProducts') || '[]');
        vendorProducts.push(newProduct);
        localStorage.setItem('vendorProducts', JSON.stringify(vendorProducts));
        
        // Add to local products array for immediate display
        products.push(newProduct);
        renderProducts();
        addProductForm.reset();
        imagePreview.classList.add('hidden');
        alert('Product saved locally. Firebase is not available.');
      }
    };
    reader.readAsDataURL(imageFile);
  };

  // Save product to Firebase Firestore and Storage
  async function saveProductToFirebase(product) {
    try {
      // Upload image to Firebase Storage
      const imageRef = ref(storage, 'product-images/' + Date.now() + '-' + product.name);
      const response = await fetch(product.image);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
      
      // Get download URL for the image
      const imageUrl = await getDownloadURL(imageRef);
      
      // Save product data to Firestore
      const docRef = await addDoc(collection(db, "vendors"), {
        name: product.name,
        price: product.price,
        category: product.category,
        location: product.location,
        whatsapp: product.whatsapp,
        description: product.description,
        image: imageUrl, // Store the image URL, not the data URL
        createdAt: serverTimestamp()
      });
      
      console.log("Product saved with ID: ", docRef.id);
      return true;
    } catch (error) {
      console.error("Error saving product to Firebase: ", error);
      return false;
    }
  }

  window.deleteProduct = async function(idx) {
    const product = products[idx];
    if (product.id) {
      // Delete from Firebase
      try {
        await deleteDoc(doc(db, "vendors", product.id));
      } catch (error) {
        console.error("Error deleting product from Firebase: ", error);
        alert("Failed to delete product from server. It will be removed locally only.");
      }
    }
    products.splice(idx, 1);
    renderProducts();
  };

  // Initialize
  loadProducts();
  renderProducts();

  // Logout functionality
  document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
      // Sign-out successful
      window.location.href = 'login.html';
    }).catch((error) => {
      // An error happened
      console.error('Logout error:', error);
    });
  });
});