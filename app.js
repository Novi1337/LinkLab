document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');
  const loginForm = document.getElementById('login-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const userEmailDisplay = document.getElementById('user-email');
  const logoutBtn = document.getElementById('logout-btn');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  
  let isLoginMode = true;

  // Tab switching logic
  tabLogin.addEventListener('click', () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    // We could change button text or form fields if needed
    authSubmitBtn.textContent = 'Login';
  });

  tabRegister.addEventListener('click', () => {
    isLoginMode = false;
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    authSubmitBtn.textContent = 'Registrieren';
  });

  // Handle Form Submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      alert('Bitte fülle alle Felder aus.');
      return;
    }

    if (isLoginMode) {
      // Simulate Login
      console.log('Logging in with', email);
    } else {
      // Simulate Register
      console.log('Registering with', email);
      alert('Erfolgreich registriert! Du wirst nun eingeloggt.');
    }

    // Switch to app screen
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    userEmailDisplay.textContent = email;
    
    // Clear form
    loginForm.reset();
  });

  // Handle Logout
  logoutBtn.addEventListener('click', () => {
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    userEmailDisplay.textContent = '';
  });
});
