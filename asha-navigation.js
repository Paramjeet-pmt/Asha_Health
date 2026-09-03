
(function () {
  const root = document.createElement('div');
  root.className = 'asha-nav-wrap';
  
  // Create navigation container with Home and Back buttons
  root.innerHTML = `
    <a href="/" class="asha-nav-btn asha-home-btn" aria-label="Go to Home">
      <span aria-hidden="true">🏠</span>
      <span>Home</span>
    </a>
    <button class="asha-nav-btn asha-back-btn" type="button" aria-label="Go back">
      <span aria-hidden="true">←</span>
      <span>Back</span>
    </button>
  `;
  document.body.appendChild(root);

  const path = location.pathname.split('/').filter(Boolean);
  const current = path.length ? path[path.length - 1] : '';

  // Pages where Back would be confusing: splash and top-level welcome/login pages.
  const noBack = new Set([
    'asha_cinematic_loading_screen',
    'welcome_to_asha_patient_portal',
    'welcome_to_rural_health_connect',
    'patient_login_1',
    'patient_login_2',
    'patient_login_variant_1',
    'patient_login_variant_2',
    'admin_secure_login_mobile',
    'admin_login',
    'loading_screen'
  ]);

  // Hide back button on splash/login pages, but keep home button visible
  if (noBack.has(current)) {
    document.querySelector('.asha-back-btn').style.display = 'none';
  }

  // Back button functionality
  document.querySelector('.asha-back-btn').addEventListener('click', function () {
    if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) {
      history.back();
    } else {
      // Fallback: go to home
      location.href = '/';
    }
  });

  // Make common internal links robust when the original Stitch export uses
  // placeholder "#" links or links to missing routes.
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return;
    // Keep ordinary existing relative links unchanged.
  });
})();
