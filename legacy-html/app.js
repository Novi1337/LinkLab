document.addEventListener('DOMContentLoaded', () => {

  // i18n translations
  const translations = {
    en: {
      title: 'LinkLib - Your Link Library',
      loginTab: 'Login',
      registerTab: 'Register',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Password',
      submitLogin: 'Login',
      submitRegister: 'Register',
      logoutBtn: 'Logout',
      newSectionBtn: '+ New Section',
      fillFieldsAlert: 'Please fill out all fields.',
      registerSuccessAlert: 'Successfully registered! You will now be logged in.',
      newSectionPrompt: 'What should the new section be called?',
      linkInputPlaceholder: 'https://...',
      addLinkBtn: 'Add Link'
    },
    de: {
      title: 'LinkLib - Deine Link Bibliothek',
      loginTab: 'Anmelden',
      registerTab: 'Registrieren',
      emailPlaceholder: 'E-Mail',
      passwordPlaceholder: 'Passwort',
      submitLogin: 'Anmelden',
      submitRegister: 'Registrieren',
      logoutBtn: 'Abmelden',
      newSectionBtn: '+ Neue Sektion',
      fillFieldsAlert: 'Bitte fülle alle Felder aus.',
      registerSuccessAlert: 'Erfolgreich registriert! Du wirst nun eingeloggt.',
      newSectionPrompt: 'Wie soll die neue Sektion heißen?',
      linkInputPlaceholder: 'https://...',
      addLinkBtn: 'Link Hinzufügen'
    }
  };

  const userLang = navigator.language || navigator.userLanguage;
  const currentLang = userLang.startsWith('de') ? 'de' : 'en';

  function __i18n(key) {
    return translations[currentLang][key] || translations['en'][key];
  }

  function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if(translations[currentLang][key]) el.textContent = translations[currentLang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if(translations[currentLang][key]) el.placeholder = translations[currentLang][key];
    });
  }

  applyLanguage();

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
    authSubmitBtn.textContent = __i18n('submitLogin');
  });

  tabRegister.addEventListener('click', () => {
    isLoginMode = false;
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    authSubmitBtn.textContent = __i18n('submitRegister');
  });

  // Handle Form Submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      alert(__i18n('fillFieldsAlert'));
      return;
    }

    if (isLoginMode) {
      // Simulate Login
      console.log('Logging in with', email);
    } else {
      // Simulate Register
      console.log('Registering with', email);
      alert(__i18n('registerSuccessAlert'));
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

  // Initialize drag & drop for sections
  Sortable.create(sectionsContainer, {
    animation: 150,
    handle: '.section-header', // drag handle
    ghostClass: 'sortable-ghost'
  });


  newSectionBtn.addEventListener('click', () => {
    const sectionName = prompt(__i18n('newSectionPrompt'));
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
        <input type="url" placeholder="${__i18n('linkInputPlaceholder')}" required />
        <button type="submit" class="primary btn-small">${__i18n('addLinkBtn')}</button>
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

      // Ensure the generated url starts with a valid protocol if missing, so window.open doesn't resolve it as a relative path
      let fullUrl = url;
      if (!/^https?:\/\//i.test(fullUrl)) {
        fullUrl = 'http://' + fullUrl;
      }

      linkItem.innerHTML = `
        <div class="thumb" id="thumb-${sectionCounter}">${initial}</div>
        <div class="link-meta">
          <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" id="title-${sectionCounter}">${domain}</a>
          <p id="desc-${sectionCounter}">Lade Metadaten...</p>
        </div>
      `;

      // Make the entire item clickable
      linkItem.addEventListener('click', (event) => {
        // Prevent click if user clicked exactly on the anchor tag to avoid double trigger
        if(event.target.tagName !== 'A'){
          window.open(fullUrl, '_blank', 'noopener,noreferrer');
        }
      });

      listEl.prepend(linkItem);
      input.value = '';

      // Fetch metadata via CORS proxy
      const thumbEl = linkItem.querySelector('.thumb');
      const titleEl = linkItem.querySelector('.link-meta a');
      const descEl = linkItem.querySelector('.link-meta p');

      fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(fullUrl)}`)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Network response was not ok.');
        })
        .then(data => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.contents, 'text/html');
          
          let pageTitle = domain;
          const titleTag = doc.querySelector('title');
          const ogTitle = doc.querySelector('meta[property="og:title"]');
          if (ogTitle && ogTitle.content) pageTitle = ogTitle.content;
          else if (titleTag && titleTag.innerText) pageTitle = titleTag.innerText;

          let pageDesc = fullUrl;
          const ogDesc = doc.querySelector('meta[property="og:description"]');
          const metaDesc = doc.querySelector('meta[name="description"]');
          if (ogDesc && ogDesc.content) pageDesc = ogDesc.content;
          else if (metaDesc && metaDesc.content) pageDesc = metaDesc.content;

          let pageImg = null;
          const ogImage = doc.querySelector('meta[property="og:image"]');
          if (ogImage && ogImage.content) pageImg = ogImage.content;
          else {
            const icon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            if (icon && icon.href) {
              // Construct absolute url if relative
              try {
                pageImg = new URL(icon.getAttribute('href'), fullUrl).href;
              } catch(e) {}
            }
          }

          // Update UI
          titleEl.textContent = pageTitle;
          descEl.textContent = pageDesc.length > 100 ? pageDesc.substring(0, 100) + '...' : pageDesc;
          
          if (pageImg) {
            thumbEl.innerHTML = '';
            thumbEl.style.backgroundImage = `url('${pageImg}')`;
            thumbEl.style.backgroundSize = 'cover';
            thumbEl.style.backgroundPosition = 'center';
          }
        })
        .catch(err => {
          // Fallback if fetching fails
          descEl.textContent = fullUrl;
        });
    });
  });
});
