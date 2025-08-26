// 🔸 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, limit, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
let loginRecaptchaVerifier = null;
let signupRecaptchaVerifier = null;
let phoneConfirmationResult = null;
let signupPhoneConfirmationResult = null;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  db = getFirestore(app);
  console.log('Firestore initialized');
  
  storage = getStorage(app);
  console.log('Firebase Storage initialized - Blaze plan active!');
  
  auth = getAuth(app);
  console.log('Firebase Auth initialized');
  auth.languageCode = 'en';
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
  alert('Failed to initialize Firebase. Please check your configuration.');
}

// 🔸 Performance optimizations
let products = [];
let filteredProducts = [];
let allMarketProducts = []; // Store all products from all vendors
let isLoading = false;
let currentUser = null;
let currentCategoryFilter = 'All';
let notificationListener = null;
let lastNotificationTime = 0;

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
  if (notificationSettingsBtn) notificationSettingsBtn.classList.add('hidden');
}

function showVendorDashboard() {
  authSection.classList.add('hidden');
  vendorDashboard.classList.remove('hidden');
  userEmail.classList.remove('hidden');
  userEmailMobile.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  if (notificationSettingsBtn) notificationSettingsBtn.classList.remove('hidden');
}

function updateUserInfo(user) {
  if (user) {
    const identifier = user.phoneNumber || user.email;
    const namePart = user.displayName ? `${user.displayName} ` : '';
    const displayText = namePart + (identifier || '');
    userEmail.textContent = displayText;
    userEmailMobile.textContent = user.displayName || identifier || '';
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
      paymentNumber: product.paymentNumber, // Add vendor payment number
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
  
  // Use filtered products if available, otherwise use all products
  const productsToRender = filteredProducts.length > 0 ? filteredProducts : [];
  
  if (productsToRender.length === 0) {
    noProductsMsg.style.display = '';
    return;
  }
  
  noProductsMsg.style.display = 'none';
  
  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  productsToRender.forEach((product, idx) => {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl transition relative';
    card.innerHTML = `
      <img src="${product.image}" alt="Product" class="w-28 h-28 object-cover rounded-full mb-4 border-4 border-green-100 shadow" loading="lazy" onerror="this.src='https://via.placeholder.com/112x112?text=Image+Error'">
      <h2 class="text-xl font-bold mb-1 text-green-700 text-center">${product.name}</h2>
      <p class="text-gray-500 mb-1 text-sm text-center">${product.category} <span class="mx-1">•</span> ${product.location}</p>
      <p class="text-gray-500 mb-1 text-sm font-semibold">Le ${product.price}</p>
      <p class="text-gray-600 text-sm mb-3 text-center hidden description">${product.description || 'No description available'}</p>
      <button class="text-green-600 text-sm font-medium mb-3 show-description hover:text-green-800 transition">Show Description</button>
      <a href="${product.paymentNumber ? 'tel:*144*2*1*' + product.paymentNumber + '#' : 'tel:*144*2*1#'}" class="mt-2 bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-green-600 transition shadow w-full justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" /></svg>
        Buy Now
      </a>
      <a href="https://wa.me/${product.whatsapp}" target="_blank" class="mt-3 bg-blue-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-blue-600 transition shadow w-full justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.72 11.06a6.5 6.5 0 10-5.66 5.66l2.12-2.12a1 1 0 01.7-.29h.01a1 1 0 01.7.29l2.12 2.12a6.5 6.5 0 00.01-5.66z" /></svg>
        WhatsApp
      </a>
    `;
    
    fragment.appendChild(card);
  });
  
  productList.appendChild(fragment);
  
  // Setup description toggles for new cards
  setupDescriptionToggles();
  
  // Update product count
  if (window.updateProductCount) {
    window.updateProductCount(productsToRender.length);
  }
}

// 🔸 Render user's own products separately
function renderUserProducts() {
  const userProductList = document.getElementById('userProductList');
  const noUserProductsMsg = document.getElementById('noUserProductsMsg');
  const userProductCount = document.getElementById('userProductCount');
  
  if (!userProductList) return;
  
  userProductList.innerHTML = '';
  
  if (products.length === 0) {
    noUserProductsMsg.style.display = '';
    userProductCount.textContent = '0 products';
    return;
  }
  
  noUserProductsMsg.style.display = 'none';
  userProductCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
  
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
      <button onclick="deleteProduct(${idx})" class="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow" title="Delete">
        <svg xmlns='http://www.w3.org/2000/svg' class='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/></svg>
      </button>
    `;
    
    fragment.appendChild(card);
  });
  
  userProductList.appendChild(fragment);
  
  // Setup description toggles for user products
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

// 🔸 Filter products by category
function filterProductsByCategory(category) {
  console.log(`Filtering by category: ${category}`);
  console.log(`Total market products: ${allMarketProducts.length}`);
  
  if (category === 'All') {
    // Show all market products
    filteredProducts = [...allMarketProducts];
    console.log(`Showing all products: ${filteredProducts.length}`);
  } else {
    // Filter market products by category
    filteredProducts = allMarketProducts.filter(product => product.category === category);
    console.log(`Filtered ${category} products: ${filteredProducts.length}`);
  }
  
  // Update filter status text
  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus) {
    if (category === 'All') {
      filterStatus.textContent = 'Showing all products';
    } else {
      filterStatus.textContent = `Showing ${category} products`;
    }
  }
  
  renderProducts();
}

// 🔸 Load existing products from Firebase (only for authenticated user)
async function loadProducts() {
  if (isLoading || !currentUser) return;
  
  try {
    isLoading = true;
    console.log('Loading products from Firebase for user:', currentUser.uid);
    
    // Load products for the current user only (for their dashboard)
    const userProductsQuery = query(
      collection(db, "vendors"), 
      where("vendorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const userQuerySnapshot = await getDocs(userProductsQuery);
    
    // Load ALL products for filtering and display (market view)
    const allProductsQuery = query(
      collection(db, "vendors"),
      orderBy("createdAt", "desc")
    );
    const allQuerySnapshot = await getDocs(allProductsQuery);
    
    // Set user's products for their dashboard
    products = [];
    userQuerySnapshot.forEach((doc) => {
      const product = doc.data();
      product.id = doc.id; // Store document ID for deletion
      products.push(product);
    });
    
    // Set all products for filtering
    allMarketProducts = [];
    allQuerySnapshot.forEach((doc) => {
      const product = doc.data();
      product.id = doc.id;
      allMarketProducts.push(product);
      console.log(`Loaded market product: ${product.name} - ${product.category}`);
    });
    
    console.log(`Loaded ${products.length} user products and ${allMarketProducts.length} total products from Firebase`);
    
    // Initialize filtered products with all products (market view)
    filteredProducts = [...allMarketProducts];
    console.log(`Initialized filteredProducts with ${filteredProducts.length} products`);
    
    // Apply current filter if one is selected
    if (currentCategoryFilter !== 'All') {
      filterProductsByCategory(currentCategoryFilter);
    } else {
      renderProducts();
    }
    
    // Always render user's own products
    renderUserProducts();
    
  } catch (error) {
    console.error("Error loading products: ", error);
    products = [];
    filteredProducts = [];
    renderProducts();
  } finally {
    isLoading = false;
  }
}

// 🔸 Notification Functions
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Notification permission result:', permission);
      return permission === 'granted';
    }

    console.log('Notification permission denied by user');
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

function showNotification(title, body, icon = null) {
  try {
    if (Notification.permission === 'granted') {
      console.log('Showing browser notification:', title, body);
      
      const notification = new Notification(title, {
        body: body,
        icon: icon || 'https://via.placeholder.com/64x64/10b981/ffffff?text=📢',
        badge: 'https://via.placeholder.com/32x32/10b981/ffffff?text=🔔',
        tag: 'naya-market-notification',
        requireInteraction: false,
        silent: false
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        try {
          notification.close();
        } catch (error) {
          console.log('Error closing notification:', error);
        }
      }, 5000);

      // Play notification sound if enabled
      if (soundToggle?.checked) {
        playNotificationSound();
      }

      return notification;
    } else {
      console.log('Cannot show notification - permission not granted');
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

function playNotificationSound() {
  try {
    console.log('Playing notification sound...');
    
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    console.log('Notification sound played successfully');
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
}

function startProductNotifications() {
  try {
    if (notificationListener) {
      console.log('Stopping existing notification listener...');
      notificationListener(); // Stop existing listener
    }

    if (!currentUser) {
      console.log('Cannot start notifications - no user logged in');
      return;
    }

    console.log('Starting real-time product notifications for user:', currentUser.uid);

    // Listen for new products from other vendors
    const productsQuery = query(
      collection(db, "vendors"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    notificationListener = onSnapshot(productsQuery, (snapshot) => {
      console.log('Notification listener triggered, checking for new products...');
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newProduct = change.doc.data();
          const productTime = newProduct.createdAt?.toDate?.() || new Date();
          const currentTime = new Date();
          const timeDifference = currentTime - productTime;
          
          console.log('New product detected:', {
            name: newProduct.name,
            vendorId: newProduct.vendorId,
            currentUserId: currentUser.uid,
            productTime: productTime,
            currentTime: currentTime,
            timeDifference: timeDifference,
            isRecent: timeDifference < 30000
          });
          
          // Only notify for products from other vendors and recent ones (last 30 seconds)
          if (newProduct.vendorId !== currentUser.uid && timeDifference < 30000) {
            
            console.log('✅ Triggering notification for new product from another vendor:', newProduct.name);
            
            // Show browser notification if enabled
            if (Notification.permission === 'granted') {
              showNotification(
                '🆕 New Product Available!',
                `${newProduct.name} - ${newProduct.category} for Le ${newProduct.price}`,
                newProduct.image
              );
            } else {
              console.log('Browser notifications not enabled');
            }

            // Show in-app notification if enabled
            if (inAppToggle?.checked) {
              showInAppNotification(newProduct);
            } else {
              console.log('In-app notifications not enabled');
            }
          } else {
            if (newProduct.vendorId === currentUser.uid) {
              console.log('Skipping notification - product is from current user');
            } else {
              console.log('Skipping notification - product is too old (', timeDifference, 'ms)');
            }
          }
        }
      });
    }, (error) => {
      console.error('Error listening for product notifications:', error);
    });

    console.log('Product notifications started successfully');
  } catch (error) {
    console.error('Error starting product notifications:', error);
  }
}

function showInAppNotification(product) {
  try {
    console.log('Showing in-app notification for:', product.name);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded">
        <div class="flex-1">
          <h4 class="font-semibold">🆕 New Product!</h4>
          <p class="text-sm">${product.name}</p>
          <p class="text-xs opacity-90">${product.category} • Le ${product.price}</p>
          <p class="text-xs opacity-75">${product.location}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 8000);
    
    console.log('In-app notification displayed successfully');
  } catch (error) {
    console.error('Error showing in-app notification:', error);
  }
}

function stopProductNotifications() {
  if (notificationListener) {
    notificationListener();
    notificationListener = null;
    console.log('Stopped product notifications');
  }
}

// 🔸 Notification Settings Functions
function updateNotificationButton() {
  try {
    const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
    if (!enableNotificationsBtn) {
      console.log('Enable notifications button not found');
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('Updating notification button to show enabled state');
      enableNotificationsBtn.textContent = 'Enabled ✓';
      enableNotificationsBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
      enableNotificationsBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
      enableNotificationsBtn.disabled = true;
    } else {
      console.log('Updating notification button to show enable state');
      enableNotificationsBtn.textContent = 'Enable';
      enableNotificationsBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
      enableNotificationsBtn.classList.add('bg-green-500', 'hover:bg-green-600');
      enableNotificationsBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error updating notification button:', error);
  }
}

function loadNotificationPreferences() {
  try {
    console.log('Loading notification preferences from localStorage...');
    
    // Load saved preferences from localStorage
    const soundEnabled = localStorage.getItem('naya-notifications-sound') !== 'false';
    const inAppEnabled = localStorage.getItem('naya-notifications-inapp') !== 'false';
    
    console.log('Loaded preferences:', { soundEnabled, inAppEnabled });
    
    if (soundToggle) {
      soundToggle.checked = soundEnabled;
      console.log('Sound toggle set to:', soundEnabled);
    }
    if (inAppToggle) {
      inAppToggle.checked = inAppEnabled;
      console.log('In-app toggle set to:', inAppEnabled);
    }
  } catch (error) {
    console.error('Error loading notification preferences:', error);
  }
}

function saveNotificationPreferences() {
  try {
    console.log('Saving notification preferences to localStorage...');
    
    if (soundToggle) {
      localStorage.setItem('naya-notifications-sound', soundToggle.checked);
      console.log('Sound preference saved:', soundToggle.checked);
    }
    if (inAppToggle) {
      localStorage.setItem('naya-notifications-inapp', inAppToggle.checked);
      console.log('In-app preference saved:', inAppToggle.checked);
    }
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
}

// 🔸 Test Notification Function
function testNotification() {
  try {
    console.log('🧪 Testing notification system...');
    
    // Test browser notification
    if (Notification.permission === 'granted') {
      showNotification(
        '🧪 Test Notification',
        'This is a test notification to verify the system is working!',
        'https://via.placeholder.com/64x64/3b82f6/ffffff?text=🧪'
      );
    } else {
      console.log('Browser notifications not enabled for testing');
    }
    
    // Test in-app notification
    if (inAppToggle?.checked) {
      const testProduct = {
        name: 'Test Product',
        category: 'Test',
        price: '0',
        location: 'Test Location',
        image: 'https://via.placeholder.com/48x48/3b82f6/ffffff?text=🧪'
      };
      showInAppNotification(testProduct);
    } else {
      console.log('In-app notifications not enabled for testing');
    }
    
    // Test sound
    if (soundToggle?.checked) {
      playNotificationSound();
    } else {
      console.log('Sound not enabled for testing');
    }
    
    console.log('🧪 Test notification completed');
  } catch (error) {
    console.error('Error testing notification:', error);
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
  const notificationSettingsBtn = document.getElementById('notificationSettingsBtn');
  
  // Get form elements
  const loginFormElement = document.getElementById('loginFormElement');
  const signupFormElement = document.getElementById('signupFormElement');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const loginPhoneInput = document.getElementById('loginPhone');
  const loginOtpInput = document.getElementById('loginOtp');
  const sendSignupOtpBtn = document.getElementById('sendSignupOtpBtn');
  const verifySignupOtpBtn = document.getElementById('verifySignupOtpBtn');
  const signupPhoneInput = document.getElementById('signupPhone');
  const signupOtpInput = document.getElementById('signupOtp');
  const addProductForm = document.getElementById('addProductForm');
  const productList = document.getElementById('productList');
  const noProductsMsg = document.getElementById('noProductsMsg');
  const imageInput = document.getElementById('productImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  
  // Notification settings elements
  const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
  const soundToggle = document.getElementById('soundToggle');
  const inAppToggle = document.getElementById('inAppToggle');
  const testNotificationBtn = document.getElementById('testNotificationBtn');
  
  console.log('UI elements found:', {
    authSection, vendorDashboard, userEmail, userEmailMobile, logoutBtn,
    loginFormElement, signupFormElement, addProductForm, notificationSettingsBtn
  });

  // 🔸 Set up authentication state listener
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    if (user) {
      console.log('User is signed in:', user.email || user.phoneNumber);
      showVendorDashboard();
      updateUserInfo(user);
      loadProducts(); // Load user's products
      renderUserProducts(); // Render user's own products
      
      // Start notifications for new products
      requestNotificationPermission().then(permission => {
        if (permission) {
          startProductNotifications();
        }
      });
    } else {
      console.log('User is signed out');
      showAuthSection();
      updateUserInfo(null);
      products = []; // Clear products
      renderProducts();
      renderUserProducts(); // Clear user's own products
      
      // Stop notifications
      stopProductNotifications();
    }
  });

  // 🔸 Set up logout button
  logoutBtn.addEventListener('click', async () => {
    const result = await signOutUser();
    if (result.success) {
      console.log('User logged out successfully');
      // Notifications will be stopped by auth state listener
    } else {
      alert('Error logging out: ' + result.error);
    }
  });

  // 🔸 Set up notification settings button
  notificationSettingsBtn?.addEventListener('click', () => {
    if (typeof window.openNotificationModal === 'function') {
      window.openNotificationModal();
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

  // 🔸 Initialize visible reCAPTCHA for login phone
  function ensureLoginRecaptcha() {
    if (!loginRecaptchaVerifier) {
      const containerId = 'vendor-recaptcha';
      const container = document.getElementById(containerId);
      if (container) {
        loginRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
      }
    }
  }

  // 🔸 Initialize visible reCAPTCHA for signup phone
  function ensureSignupRecaptcha() {
    if (!signupRecaptchaVerifier) {
      const containerId = 'vendor-recaptcha-signup';
      const container = document.getElementById(containerId);
      if (container) {
        signupRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
      }
    }
  }

  // 🔸 Send OTP for login
  sendOtpBtn?.addEventListener('click', async () => {
    try {
      const phone = (loginPhoneInput?.value || '').trim();
      if (!phone.startsWith('+') || phone.length < 8) {
        alert('Enter a valid phone with country code, e.g., +23275674419');
        return;
      }
      ensureLoginRecaptcha();
      await loginRecaptchaVerifier.render();
      phoneConfirmationResult = await signInWithPhoneNumber(auth, phone, loginRecaptchaVerifier);
      alert('OTP sent. Please check your phone.');
    } catch (error) {
      alert('Failed to send OTP: ' + error.message);
    }
  });

  // 🔸 Verify OTP for login
  verifyOtpBtn?.addEventListener('click', async () => {
    try {
      const code = (loginOtpInput?.value || '').trim();
      if (!code) { alert('Enter the OTP code'); return; }
      if (!phoneConfirmationResult) { alert('Please send OTP first'); return; }
      const result = await phoneConfirmationResult.confirm(code);
      alert('Phone login successful');
      // Auth state listener updates UI
    } catch (error) {
      alert('OTP verification failed: ' + error.message);
    }
  });

  // 🔸 Send OTP for signup
  sendSignupOtpBtn?.addEventListener('click', async () => {
    try {
      const phone = (signupPhoneInput?.value || '').trim();
      if (!phone.startsWith('+') || phone.length < 8) {
        alert('Enter a valid phone with country code, e.g., +23275674419');
        return;
      }
      ensureSignupRecaptcha();
      await signupRecaptchaVerifier.render();
      signupPhoneConfirmationResult = await signInWithPhoneNumber(auth, phone, signupRecaptchaVerifier);
      alert('OTP sent. Please check your phone.');
    } catch (error) {
      alert('Failed to send OTP: ' + error.message);
    }
  });

  // 🔸 Verify OTP for signup
  verifySignupOtpBtn?.addEventListener('click', async () => {
    try {
      const code = (signupOtpInput?.value || '').trim();
      if (!code) { alert('Enter the OTP code'); return; }
      if (!signupPhoneConfirmationResult) { alert('Please send OTP first'); return; }
      const result = await signupPhoneConfirmationResult.confirm(code);
      alert('Phone signup/login successful');
      // Optionally set display name from signup form
      const fullName = document.getElementById('signupName')?.value?.trim();
      if (fullName) {
        try { await updateProfile(result.user, { displayName: fullName }); } catch (_) {}
      }
    } catch (error) {
      alert('OTP verification failed: ' + error.message);
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

  // 🔸 Phone number validation function for Sierra Leone
  function validateSierraLeonePhone(phoneNumber) {
    // Remove any spaces or special characters except + and digits
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it starts with +232 or 232
    if (cleanNumber.startsWith('+232')) {
      const mobilePart = cleanNumber.substring(4);
      // Mobile number should be 8 digits
      return /^\d{8}$/.test(mobilePart);
    } else if (cleanNumber.startsWith('232')) {
      const mobilePart = cleanNumber.substring(3);
      // Mobile number should be 8 digits
      return /^\d{8}$/.test(mobilePart);
    }
    
    return false;
  }

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
    
    // Validate phone number
    if (!validateSierraLeonePhone(whatsapp)) {
      alert('Please enter a valid Sierra Leone phone number. Format: 232XXXXXXXXX (where X is a digit)');
      return;
    }
    
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
      const paymentNumber = document.getElementById('vendorPaymentNumber').value.trim();
      const newProduct = { name, price, category, location, whatsapp, description, image: imageURL, paymentNumber };
      
      // Save to Firebase
      const saved = await saveProductToFirebase(newProduct);
      if (saved) {
        console.log('Product saved to Firebase successfully');
        // Add to local products array for immediate display
        products.unshift(newProduct); // Add to beginning for better UX
        
        // Update filtered products based on current filter
        if (currentCategoryFilter === 'All' || newProduct.category === currentCategoryFilter) {
          filteredProducts.unshift(newProduct);
        }
        
        renderProducts();
        renderUserProducts(); // Re-render user products to show the new one
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
    
    // Update filtered products
    if (currentCategoryFilter === 'All') {
      filteredProducts = [...products];
    } else {
      filteredProducts = products.filter(product => product.category === currentCategoryFilter);
    }
    
    renderProducts();
    renderUserProducts(); // Re-render user products to show the updated list
  };

  // 🔸 Set up category filter buttons
  const categoryFilterButtons = document.querySelectorAll('.category-filter-btn');
  categoryFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-category');
      
      // Update current filter
      currentCategoryFilter = selectedCategory;
      
      // Remove active state from all buttons
      categoryFilterButtons.forEach(b => {
        b.classList.remove('active');
      });
      
      // Add active state to selected button
      btn.classList.add('active');
      
      // Filter products
      filterProductsByCategory(selectedCategory);
    });
  });

  // Set default "All" category as active
  const allCategoryBtn = document.querySelector('.category-filter-btn[data-category="All"]');
  if (allCategoryBtn) {
    allCategoryBtn.classList.add('active');
  }

  // 🔸 Set up real-time phone number validation
  const whatsappInput = document.getElementById('productWhatsApp');
  if (whatsappInput) {
    whatsappInput.addEventListener('input', function() {
      const phoneNumber = this.value.trim();
      const isValid = phoneNumber === '' || validateSierraLeonePhone(phoneNumber);
      
      if (phoneNumber !== '') {
        if (isValid) {
          this.classList.remove('border-red-500');
          this.classList.add('border-green-500');
          // Remove any existing error message
          const existingError = this.parentElement.querySelector('.phone-error');
          if (existingError) {
            existingError.remove();
          }
        } else {
          this.classList.remove('border-green-500');
          this.classList.add('border-red-500');
          // Add error message if not already present
          if (!this.parentElement.querySelector('.phone-error')) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'phone-error text-red-500 text-sm mt-1';
            errorMsg.textContent = 'Please enter a valid Sierra Leone number (e.g., 23275674419)';
            this.parentElement.appendChild(errorMsg);
          }
        }
      } else {
        this.classList.remove('border-red-500', 'border-green-500');
        // Remove error message when field is empty
        const existingError = this.parentElement.querySelector('.phone-error');
        if (existingError) {
          existingError.remove();
        }
      }
    });
  }

  // 🔸 Notification Settings
  enableNotificationsBtn?.addEventListener('click', () => {
    requestNotificationPermission().then(permission => {
      if (permission) {
        updateNotificationButton();
        saveNotificationPreferences();
        startProductNotifications(); // Restart notifications with new preferences
      } else {
        alert('Notification permission denied. You can enable it in your browser settings.');
        updateNotificationButton();
        saveNotificationPreferences();
      }
    });
  });

  soundToggle?.addEventListener('change', () => {
    saveNotificationPreferences();
    if (soundToggle.checked) {
      startProductNotifications(); // Restart notifications with new preferences
    } else {
      stopProductNotifications();
    }
  });

  inAppToggle?.addEventListener('change', () => {
    saveNotificationPreferences();
    if (inAppToggle.checked) {
      startProductNotifications(); // Restart notifications with new preferences
    } else {
      stopProductNotifications();
    }
  });

  loadNotificationPreferences(); // Load saved preferences on page load
  
  // Update notification button state on page load
  updateNotificationButton();
  
  // Listen for notification permission changes
  if ('Notification' in window) {
    // Check permission every 5 seconds (for when user changes it in browser settings)
    setInterval(() => {
      updateNotificationButton();
    }, 5000);
  }

  // 🔸 Set up test notification button
  testNotificationBtn?.addEventListener('click', testNotification);

  console.log('Vendor page initialized with authentication and responsive design');
});