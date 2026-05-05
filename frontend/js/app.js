import { api } from './api.js';

// Global Toast Utility
export const showToast = (message, isError = false) => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
};

// Auth Page Logic
const initAuthPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  let isSignup = urlParams.get('mode') === 'signup';
  
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const nameGroup = document.getElementById('name-group');
  const mobileGroup = document.getElementById('mobile-group');
  const roleSelector = document.getElementById('role-selector');
  const submitBtn = document.getElementById('submit-btn');
  const switchText = document.getElementById('switch-text');
  const switchLink = document.getElementById('switch-link');
  const form = document.getElementById('auth-form');
  
  if (!form) return; // Not on auth page

  let currentRole = 'passenger';

  const updateUI = () => {
    if (isSignup) {
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Join BusTimeTrack today';
      nameGroup.style.display = 'block';
      mobileGroup.style.display = 'block';
      roleSelector.style.display = 'flex';
      submitBtn.textContent = 'Sign Up';
      switchText.textContent = 'Already have an account?';
      switchLink.textContent = 'Login';
      
      // Update role buttons
      document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === currentRole);
      });
    } else {
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Login to your account to continue';
      nameGroup.style.display = 'none';
      mobileGroup.style.display = 'none';
      roleSelector.style.display = 'flex'; // Always visible
      submitBtn.textContent = 'Login';
      switchText.textContent = "Don't have an account?";
      switchLink.textContent = 'Sign Up';
    }
  };

  updateUI();

  switchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    window.history.replaceState({}, '', `/auth.html?mode=${isSignup ? 'signup' : 'login'}`);
    updateUI();
  });

  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentRole = btn.dataset.role;
      updateUI();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait...';
      
      if (isSignup) {
        const name = document.getElementById('name').value;
        const mobile = document.getElementById('mobile').value;
        await api.signup({ name, email, password, mobile, role: currentRole });
        showToast('Account created successfully!');
      } else {
        const response = await api.login(email, password);
        if (response.role !== currentRole) {
          throw new Error(`You are registered as a ${response.role}, not a ${currentRole}. Please select the correct role.`);
        }
        showToast('Login successful!');
      }
      
      // Redirect based on role
      const user = api.getUser();
      setTimeout(() => {
        if (user.role === 'owner') {
          window.location.href = '/owner.html';
        } else {
          window.location.href = '/passenger.html';
        }
      }, 1000);
      
    } catch (error) {
      showToast(error.message, true);
      submitBtn.disabled = false;
      submitBtn.textContent = isSignup ? 'Sign Up' : 'Login';
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initAuthPage();
  
  // Dashboard Auth Check
  const isPassengerPage = window.location.pathname.includes('passenger.html');
  const isOwnerPage = window.location.pathname.includes('owner.html');
  
  if (isPassengerPage || isOwnerPage) {
    const user = api.getUser();
    if (!user) {
      window.location.href = '/auth.html?mode=login';
    } else if (isOwnerPage && user.role !== 'owner') {
      window.location.href = '/passenger.html';
    } else if (isPassengerPage && user.role !== 'passenger') {
      window.location.href = '/owner.html';
    }
    
    // Set user info
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) userNameEl.textContent = user.name;
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        api.logout();
      });
    }
  }
});
