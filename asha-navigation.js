
(function () {
  const root = document.createElement('div');
  root.className = 'asha-back-wrap';
  root.innerHTML = '<button class="asha-back-btn" type="button" aria-label="Go back"><span aria-hidden="true">←</span><span>Back</span></button>';
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
    'admin_secure_login_mobile'
  ]);

  if (noBack.has(current)) root.style.display = 'none';

  root.querySelector('button').addEventListener('click', function () {
    if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) {
      history.back();
    } else {
      const fallback = document.referrer ? document.referrer : '../';
      location.href = fallback;
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
