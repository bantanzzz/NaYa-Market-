// 🔸 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// 🔸 Initialize Firebase globally
let app, db;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  db = getFirestore(app);
  console.log('Firestore initialized');
  
  console.log('Storage disabled - using free plan');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  alert('Failed to initialize Firebase. Please check your configuration.');
}

// 🔸 Performance optimizations
let products = [];
let isLoading = false;

// 🔸 Optimized image compression function
function compressImage(file, maxWidth = 400, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// 🔸 Save product to Firebase Firestore (without Storage for free plan)
async function saveProductToFirebase(product) {
  try {
    console.log('Starting Firebase save process...');
    
    // For free plan, we'll store the image as a data URL directly in Firestore
    // Note: This has size limitations but works for free tier
    console.log('Saving product data to Firestore (free plan mode)...');
    
    const docRef = await addDoc(collection(db, "vendors"), {
      name: product.name,
      price: product.price,
      category: product.category,
      location: product.location,
      whatsapp: product.whatsapp,
      description: product.description,
      image: product.image, // Store the data URL directly
      createdAt: serverTimestamp()
    });
    
    console.log("Product saved with ID: ", docRef.id);
    return true;
  } catch (error) {
    console.error("Error saving product to Firebase: ", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
}

// 🔸 Optimized product rendering with DocumentFragment
function renderProducts() {
  if (isLoading) return;
  
  const productList = document.getElementById('productList');
  const noProductsMsg = document.getElementById('noProductsMsg');
  
  productList.innerHTML = '';
  
  if (products.length === 0) {
    noProductsMsg.style.display = '';
    return;
  }
  
  noProductsMsg.style.display = 'none';
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  products.forEach((product, idx) => {
    const card = document.createElement('div');
    card.className = 'vendor-card bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition relative';
    card.innerHTML = `
      <img src="${product.image}" alt="Product" class="w-28 h-28 object-cover rounded-full mb-4 border-4 border-green-100 shadow" loading="lazy">
      <h2 class="text-xl font-bold mb-1 text-green-700">${product.name}</h2>
      <p class="text-gray-500 mb-1 text-sm">${product.category} <span class="mx-1">•</span> ${product.location}</p>
      <p class="text-gray-500 mb-1 text-sm">Le ${product.price}</p>
      <p class="text-gray-600 text-sm mb-2">${product.description || 'No description available'}</p>
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
    
    fragment.appendChild(card);
  });
  
  productList.appendChild(fragment);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, Firebase already initialized...');
  
  const addProductForm = document.getElementById('addProductForm');
  const productList = document.getElementById('productList');
  const noProductsMsg = document.getElementById('noProductsMsg');
  const imageInput = document.getElementById('productImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  
  console.log('Form elements found:', {
    addProductForm: addProductForm,
    productList: productList,
    noProductsMsg: noProductsMsg,
    imageInput: imageInput,
    imagePreview: imagePreview,
    previewImg: previewImg
  });

  // 🔸 Load existing products from Firebase with pagination
  async function loadProducts() {
    if (isLoading) return;
    
    try {
      isLoading = true;
      console.log('Loading products from Firebase...');
      
      // Load products without limit for faster access
      const q = query(collection(db, "vendors"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      products = [];
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        product.id = doc.id; // Store document ID for deletion
        products.push(product);
      });
      
      console.log(`Loaded ${products.length} products from Firebase`);
      
    } catch (error) {
      console.error("Error loading products: ", error);
      // Fallback to localStorage if Firebase fails
      const savedProducts = localStorage.getItem('vendorProducts');
      if (savedProducts) {
        products = JSON.parse(savedProducts);
        console.log(`Loaded ${products.length} products from localStorage`);
      }
    } finally {
      isLoading = false;
    }
  }

  // 🔸 Handle image preview with compression
  imageInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
      try {
        // Show loading state
        imagePreview.classList.remove('hidden');
        previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA1NkM1Mi40MTgzIDU2IDU2IDUyLjQxODMgNTYgNDhDNTYgNDMuNTgxNyA1Mi40MTgzIDQwIDQ4IDQwQzQzLjU4MTcgNDAgNDAgNDMuNTgxNyA0MCA0OEM0MCA1Mi40MTgzIDQzLjU4MTcgNDAgNDggNDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik00OCA2NEM1Ny42NzQ5IDY0IDY2IDU1LjY3NDkgNjYgNDZDNjYgMzYuMzI1MSA1Ny42NzQ5IDI4IDQ4IDI4QzM4LjMyNTEgMjggMzAgMzYuMzI1MSAzMCA0NkMzMCA1NS42NzQ5IDM4LjMyNTEgNjQgNDggNjRaIiBzdHJva2U9IiM5QjlCQTAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
        
        // Compress image for better performance
        const compressedImage = await compressImage(file, 400, 0.8);
        previewImg.src = compressedImage;
        
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to original file
        const reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    } else {
      imagePreview.classList.add('hidden');
    }
  });

  addProductForm.onsubmit = async function(e) {
    e.preventDefault();
    console.log('Form submitted, processing...');
    
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value.trim();
    const category = document.getElementById('productCategory').value;
    const location = document.getElementById('productLocation').value.trim();
    const whatsapp = document.getElementById('productWhatsApp').value.trim();
    const imageFile = document.getElementById('productImage').files[0];
    
    console.log('Form data:', { name, price, category, location, whatsapp, imageFile: imageFile ? 'selected' : 'none' });
    
    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    const description = document.getElementById('productDescription').value.trim();
    
    try {
      // Show loading state
      const submitBtn = addProductForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Adding Product...';
      submitBtn.disabled = true;
      
      // Compress image for better performance
      const compressedImage = await compressImage(imageFile, 400, 0.8);
      const newProduct = { name, price, category, location, whatsapp, description, image: compressedImage };
      
      // Save to Firebase
      const saved = await saveProductToFirebase(newProduct);
      if (saved) {
        console.log('Product saved to Firebase successfully');
        // Add to local products array for immediate display
        products.unshift(newProduct); // Add to beginning for better UX
        renderProducts();
        addProductForm.reset();
        imagePreview.classList.add('hidden');
        alert('Product added successfully! It will appear on the home page.');
      } else {
        console.log('Firebase save failed, falling back to localStorage');
        // Fallback to localStorage if Firebase fails
        let vendorProducts = JSON.parse(localStorage.getItem('vendorProducts') || '[]');
        vendorProducts.unshift(newProduct);
        localStorage.setItem('vendorProducts', JSON.stringify(vendorProducts));
        
        // Add to local products array for immediate display
        products.unshift(newProduct);
        renderProducts();
        addProductForm.reset();
        imagePreview.classList.add('hidden');
        alert('Product saved locally. Firebase is not available.');
      }
    } catch (error) {
      console.error('Error processing form:', error);
      alert('Error processing your request. Please try again.');
    } finally {
      // Reset button state
      const submitBtn = addProductForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Add Product';
      submitBtn.disabled = false;
    }
  };

  window.deleteProduct = async function(idx) {
    const product = products[idx];
    if (product.id) {
      // Delete from Firebase
      try {
        await deleteDoc(doc(db, "vendors", product.id));
        console.log('Product deleted from Firebase');
      } catch (error) {
        console.error("Error deleting product from Firebase: ", error);
        alert("Failed to delete product from server. It will be removed locally only.");
      }
    }
    products.splice(idx, 1);
    renderProducts();
  };

  // Initialize - Load products immediately
  loadProducts().then(() => {
    renderProducts();
  });
});