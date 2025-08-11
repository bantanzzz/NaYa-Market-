// 🔸 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔸 Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDXfcM8ClwOJE8Zv6u-N-RuLCxNnjwXuus",
  authDomain: "naya-market-60190.firebaseapp.com",
  projectId: "naya-market-60190",
  storageBucket: "naya-market-60190.firebasestorage.app",
  messagingSenderId: "591341489607",
  appId: "1:591341489607:web:f7b75b28d85d7481869de2"
};

// 🔸 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginFormElement = document.getElementById('loginFormElement');
  const signupFormElement = document.getElementById('signupFormElement');
  const showSignupBtn = document.getElementById('showSignup');
  const showLoginBtn = document.getElementById('showLogin');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  // Toggle between login and signup forms
  showSignupBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  });

  showLoginBtn.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Handle login form submission
  loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Login successful
      successMessage.textContent = 'Login successful! Redirecting to vendor dashboard...';
      successMessage.classList.remove('hidden');
      errorMessage.classList.add('hidden');
      
      // Redirect to vendor dashboard after a short delay
      setTimeout(() => {
        window.location.href = 'vendor.html';
      }, 1500);
    } catch (error) {
      // Handle login errors
      errorMessage.textContent = getAuthErrorMessage(error.code);
      errorMessage.classList.remove('hidden');
      successMessage.classList.add('hidden');
    }
  });

  // Handle signup form submission
  signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.classList.remove('hidden');
      successMessage.classList.add('hidden');
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Signup successful
      successMessage.textContent = 'Account created successfully! Redirecting to vendor dashboard...';
      successMessage.classList.remove('hidden');
      errorMessage.classList.add('hidden');
      
      // Redirect to vendor dashboard after a short delay
      setTimeout(() => {
        window.location.href = 'vendor.html';
      }, 1500);
    } catch (error) {
      // Handle signup errors
      errorMessage.textContent = getAuthErrorMessage(error.code);
      errorMessage.classList.remove('hidden');
      successMessage.classList.add('hidden');
    }
  });

  // Helper function to get user-friendly error messages
  function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please login instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
});