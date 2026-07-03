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

  // App Logic
  const newSectionBtn = document.getElementById('new-section-btn');
  const sectionsContainer = document.getElementById('sections');
  let sectionCounter = 0;

  newSectionBtn.addEventListener('click', () => {
    const sectionName = prompt('Wie soll die neue Sektion heißen?');
    if (!sectionName || sectionName.trim() === '') return;

    sectionCounter++;
    const sectionId = `section-${sectionCounter}`;

    const sectionEl = document.createElement('div');
    sectionEl.className = 'section';
    sectionEl.innerHTML = `
      <div class="section-header">
        <h3>${sectionName.trim()}</h3>
      </div>
      <form class="form-inline add-link-form" data-target="${sectionId}">
        <input type="url" placeholder="https://..." required />
        <button type="submit" class="primary btn-small">Link Hinzufügen</button>
      </form>
      <ul class="links-list" id="${sectionId}"></ul>
    `;

    sectionsContainer.prepend(sectionEl);

    // Form logic for new links
    const addLinkForm = sectionEl.querySelector('.add-link-form');
    addLinkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const url = input.value.trim();
      if (!url) return;
      
      const targetListId = e.target.getAttribute('data-target');
      const listEl = document.getElementById(targetListId);
      
      const linkItem = document.createElement('li');
      linkItem.className = 'link-item';
      
      // Extract domain for a simple icon/initials
      let domain = url;
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname;
      } catch (err) {
        // use url if invalid
      }
      const initial = domain.replace(/^www\./, '').charAt(0).toUpperCase();

      linkItem.innerHTML = `
        <div class="thumb">${initial}</div>
        <div class="link-meta">
          <a href="${url}" target="_blank" rel="noopener noreferrer">${domain}</a>
          <p>${url}</p>
        </div>
      `;

      listEl.prepend(linkItem);
      input.value = '';
    });
  });
});
