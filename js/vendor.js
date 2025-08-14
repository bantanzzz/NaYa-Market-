// 🔸 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
let app, db, storage, auth;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  db = getFirestore(app);
  console.log('Firestore initialized');
  
  storage = getStorage(app);
  console.log('Firebase Storage initialized - Blaze plan active!');
  
  auth = getAuth(app);
  console.log('Firebase Auth initialized');
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
  alert('Failed to initialize Firebase. Please check your configuration.');
}

// 🔸 Performance optimizations
let products = [];
let isLoading = false;
let currentUser = null;

// 🔸 UI Elements
let authSection, vendorDashboard, userEmail, userEmailMobile, logoutBtn;

// 🔸 Authentication Functions
async function signUp(email, password, fullName) {
  try {
    console.log('Creating new user account...');
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with full name
    await updateProfile(user, {
      displayName: fullName
    });
    
    console.log('User account created successfully:', user.uid);
    return { success: true, user };
    
  } catch (error) {
    console.error('Error creating user account:', error);
    let errorMessage = 'Failed to create account.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please login instead.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters long.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

async function signIn(email, password) {
  try {
    console.log('Signing in user...');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User signed in successfully:', user.uid);
    return { success: true, user };
    
  } catch (error) {
    console.error('Error signing in:', error);
    let errorMessage = 'Failed to sign in.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email. Please sign up first.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

async function signOutUser() {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: 'Failed to sign out.' };
  }
}

// 🔸 UI State Management
function showAuthSection() {
  authSection.classList.remove('hidden');
  vendorDashboard.classList.add('hidden');
  userEmail.classList.add('hidden');
  userEmailMobile.classList.add('hidden');
  logoutBtn.classList.add('hidden');
}

function showVendorDashboard() {
  authSection.classList.add('hidden');
  vendorDashboard.classList.remove('hidden');
  userEmail.classList.remove('hidden');
  userEmailMobile.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
}

function updateUserInfo(user) {
  if (user) {
    const displayText = user.displayName ? `${user.displayName} (${user.email})` : user.email;
    userEmail.textContent = displayText;
    userEmailMobile.textContent = user.displayName || user.email;
  } else {
    userEmail.textContent = '';
    userEmailMobile.textContent = '';
  }
}

// 🔸 Upload image to Firebase Storage
async function uploadImageToStorage(file, productName) {
  try {
    console.log('Uploading image to Firebase Storage...');
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.jpg`;
    const storageRef = ref(storage, `product-images/${fileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Image uploaded successfully');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
    
  } catch (error) {
    console.error('Error uploading image to Storage:', error);
    throw error;
  }
}

// 🔸 Save product to Firebase Firestore with Storage URLs
async function saveProductToFirebase(product) {
  try {
    console.log('Starting Firebase save process with Storage...');
    
    // Save product data to Firestore (without image data)
    const docRef = await addDoc(collection(db, "vendors"), {
      name: product.name,
      price: product.price,
      category: product.category,
      location: product.location,
      whatsapp: product.whatsapp,
      description: product.description,
      image: product.image, // This is now the Storage URL
      createdAt: serverTimestamp(),
      vendorId: currentUser.uid, // Add vendor ID for security
      vendorEmail: currentUser.email
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

// 🔸 Delete image from Firebase Storage
async function deleteImageFromStorage(imageURL) {
  try {
    if (imageURL && imageURL.includes('firebasestorage.googleapis.com')) {
      const imageRef = ref(storage, imageURL);
      await deleteObject(imageRef);
      console.log('Image deleted from Storage');
    }
  } catch (error) {
    console.error('Error deleting image from Storage:', error);
  }
}

// 🔸 Optimized product rendering with DocumentFragment and responsive design
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
    card.className = 'product-card bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition relative';
    card.innerHTML = `
      <img src="${product.image}" alt="Product" class="w-28 h-28 object-cover rounded-full mb-4 border-4 border-green-100 shadow" loading="lazy" onerror="this.src='https://via.placeholder.com/112x112?text=Image+Error'">
      <h2 class="text-xl font-bold mb-1 text-green-700 text-center">${product.name}</h2>
      <p class="text-gray-500 mb-1 text-sm text-center">${product.category} <span class="mx-1">•</span> ${product.location}</p>
      <p class="text-gray-500 mb-1 text-sm font-semibold">Le ${product.price}</p>
      <p class="text-gray-600 text-sm mb-3 text-center hidden description">${product.description || 'No description available'}</p>
      <button class="text-green-600 text-sm font-medium mb-3 show-description hover:text-green-800 transition">Show Description</button>
      <a href="https://wa.me/${product.whatsapp}?text=I'm%20interested%20in%20buying%20${product.name}%20priced%20at%20Le%20${product.price}" target="_blank" class="mt-2 bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 transition shadow w-full justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" /></svg>
        Buy Now
      </a>
      <a href="https://wa.me/${product.whatsapp}" target="_blank" class="mt-3 bg-blue-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-blue-600 transition shadow w-full justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.72 11.06a6.5 6.5 0 10-5.66 5.66l2.12-2.12a1 1 0 01.7-.29h.01a1 1 0 01.7.29l2.12 2.12a6.5 6.5 0 00.01-5.66z" /></svg>
        WhatsApp
      </a>
      <button onclick="deleteProduct(${idx})" class="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow" title="Delete">
        <svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/></svg>
      </button>
    `;
    
    fragment.appendChild(card);
  });
  
  productList.appendChild(fragment);
  
  // Setup description toggles for new cards
  setupDescriptionToggles();
  
  // Update product count
  if (window.updateProductCount) {
    window.updateProductCount(products.length);
  }
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

// 🔸 Load existing products from Firebase (only for authenticated user)
async function loadProducts() {
  if (isLoading || !currentUser) return;
  
  try {
    isLoading = true;
    console.log('Loading products from Firebase for user:', currentUser.uid);
    
    // Load products for the current user only
    const q = query(
      collection(db, "vendors"), 
      where("vendorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    products = [];
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      product.id = doc.id; // Store document ID for deletion
      products.push(product);
    });
    
    console.log(`Loaded ${products.length} products from Firebase for user`);
    renderProducts();
    
  } catch (error) {
    console.error("Error loading products: ", error);
    products = [];
    renderProducts();
  } finally {
    isLoading = false;
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, Firebase already initialized...');
  
  // Get UI elements
  authSection = document.getElementById('authSection');
  vendorDashboard = document.getElementById('vendorDashboard');
  userEmail = document.getElementById('userEmail');
  userEmailMobile = document.getElementById('userEmailMobile');
  logoutBtn = document.getElementById('logoutBtn');
  
  // Get form elements
  const loginFormElement = document.getElementById('loginFormElement');
  const signupFormElement = document.getElementById('signupFormElement');
  const addProductForm = document.getElementById('addProductForm');
  const productList = document.getElementById('productList');
  const noProductsMsg = document.getElementById('noProductsMsg');
  const imageInput = document.getElementById('productImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  
  console.log('UI elements found:', {
    authSection, vendorDashboard, userEmail, userEmailMobile, logoutBtn,
    loginFormElement, signupFormElement, addProductForm
  });

  // 🔸 Set up authentication state listener
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    if (user) {
      console.log('User is signed in:', user.email);
      showVendorDashboard();
      updateUserInfo(user);
      loadProducts(); // Load user's products
    } else {
      console.log('User is signed out');
      showAuthSection();
      updateUserInfo(null);
      products = []; // Clear products
      renderProducts();
    }
  });

  // 🔸 Set up logout button
  logoutBtn.addEventListener('click', async () => {
    const result = await signOutUser();
    if (result.success) {
      console.log('User logged out successfully');
    } else {
      alert('Error logging out: ' + result.error);
    }
  });

  // 🔸 Set up login form
  loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    const submitBtn = loginFormElement.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;
    
    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        console.log('Login successful');
        // Auth state listener will handle UI update
      } else {
        alert('Login failed: ' + result.error);
      }
    } catch (error) {
      alert('Unexpected error: ' + error.message);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // 🔸 Set up signup form
  signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (!fullName || !email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    const submitBtn = signupFormElement.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
      const result = await signUp(email, password, fullName);
      
      if (result.success) {
        console.log('Signup successful');
        alert('Account created successfully! You are now logged in.');
        // Auth state listener will handle UI update
      } else {
        alert('Signup failed: ' + result.error);
      }
    } catch (error) {
      alert('Unexpected error: ' + error.message);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // 🔸 Handle image preview
  imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      try {
        // Show loading state
        imagePreview.classList.remove('hidden');
        previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA1NkM1Mi40MTgzIDU2IDU2IDUyLjQxODMgNTYgNDhDNTYgNDMuNTgxNyA1Mi40MTgzIDQwIDQ4IDQwQzQzLjU4MTcgNDAgNDAgNDMuNTgxNyA0MCA0OEM0MCA1Mi40MTgzIDQzLjU4MTcgNDAgNDggNDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik00OCA2NEM1Ny42NzQ5IDY0IDY2IDU1LjY3NDkgNjYgNDZDNjYgMzYuMzI1MSA1Ny42NzQ5IDI4IDQ4IDI4QzM4LjMyNTEgMjggMzAgMzYuMzI1MSAzMCA0NkMzMCA1NS42NzQ5IDM4LjMyNTEgNjQgNDggNjRaIiBzdHJva2U9IiM5QjlCQTAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
        
        // Show preview of original file
        const reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try again.');
      }
    } else {
      imagePreview.classList.add('hidden');
    }
  });

  // 🔸 Set up add product form
  addProductForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Please login to add products');
      return;
    }
    
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
      submitBtn.textContent = 'Uploading Image...';
      submitBtn.disabled = true;
      
      // Upload image to Firebase Storage
      console.log('Uploading image to Firebase Storage...');
      const imageURL = await uploadImageToStorage(imageFile, name);
      
      // Update button text
      submitBtn.textContent = 'Saving Product...';
      
      // Create product object with Storage URL
      const newProduct = { name, price, category, location, whatsapp, description, image: imageURL };
      
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
        console.log('Firebase save failed');
        alert('Failed to save product. Please try again.');
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
  });

  // 🔸 Set up delete product function
  window.deleteProduct = async function(idx) {
    if (!currentUser) {
      alert('Please login to delete products');
      return;
    }
    
    const product = products[idx];
    
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }
    
    // Delete image from Storage first
    if (product.image) {
      await deleteImageFromStorage(product.image);
    }
    
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

  console.log('Vendor page initialized with authentication and responsive design');
});