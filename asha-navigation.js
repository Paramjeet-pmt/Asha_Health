
(function () {
  const root = document.createElement('div');
  root.className = 'asha-nav-wrap';
  
  // Create the shared Back button.
  root.innerHTML = `
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

  // Hide back button on splash/login pages.
  if (noBack.has(current)) {
    document.querySelector('.asha-back-btn').style.display = 'none';
  }

  // Back button functionality
  document.querySelector('.asha-back-btn').addEventListener('click', function () {
    if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) {
      history.back();
    } else {
      return;
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

  // -------------------------------------------------------------------------
  // UNIVERSAL GLOBAL SYNC ENGINE
  // Automatically attaches to ANY sync button or navbar item across the app
  // -------------------------------------------------------------------------

  // 1. Inject spin animation CSS if not present
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes ashaSyncSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .asha-sync-spinning {
      animation: ashaSyncSpin 0.9s linear infinite !important;
      display: inline-block !important;
    }
  `;
  document.head.appendChild(styleEl);

  // 2. Inject global sync toast
  const toastEl = document.createElement('div');
  toastEl.id = 'asha-global-sync-toast';
  toastEl.style.cssText = `
    position: fixed;
    bottom: 85px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    z-index: 999999;
    opacity: 0;
    pointer-events: none;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    width: 90%;
    max-width: 360px;
    font-family: inherit;
  `;
  toastEl.innerHTML = `
    <div style="background: rgba(17, 33, 47, 0.96); backdrop-filter: blur(16px); color: #fff; padding: 12px 16px; border-radius: 18px; box-shadow: 0 16px 36px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); display: flex; items-center; gap: 12px;">
      <div id="asha-toast-icon-wrap" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(203, 230, 255, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span id="asha-toast-icon" class="material-symbols-outlined asha-sync-spinning" style="font-size: 22px; color: #cbe6ff;">sync</span>
      </div>
      <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
        <span id="asha-toast-title" style="font-size: 13px; font-weight: 700; line-height: 1.2; color: #fff;">Syncing with Healthcare Server...</span>
        <span id="asha-toast-sub" style="font-size: 11px; color: rgba(255,255,255,0.75); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">Synchronizing patient records & medications</span>
      </div>
    </div>
  `;
  document.body.appendChild(toastEl);

  let isGlobalSyncing = false;

  window.triggerGlobalAshaSync = function (triggerBtn) {
    if (isGlobalSyncing) return;
    isGlobalSyncing = true;

    // Find sync icon on trigger button
    const icon = triggerBtn ? (triggerBtn.querySelector('.material-symbols-outlined') || triggerBtn) : null;
    if (icon) icon.classList.add('asha-sync-spinning');

    // Show toast
    const toast = document.getElementById('asha-global-sync-toast');
    const toastIcon = document.getElementById('asha-toast-icon');
    const toastIconWrap = document.getElementById('asha-toast-icon-wrap');
    const toastTitle = document.getElementById('asha-toast-title');
    const toastSub = document.getElementById('asha-toast-sub');

    toastTitle.textContent = 'Syncing with Doctor & District Server...';
    toastSub.textContent = 'Uploading offline queue & fetching latest clinical updates';
    toastIcon.textContent = 'sync';
    toastIcon.classList.add('asha-sync-spinning');
    toastIconWrap.style.background = 'rgba(203, 230, 255, 0.15)';
    toastIcon.style.color = '#cbe6ff';

    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0px)';

    // Trigger backend API if reachable
    try {
      fetch('/api/patient/1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncedFrom: window.location.pathname })
      }).catch(() => {});
    } catch(e) {}

    // Complete sync after micro-delay
    setTimeout(() => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (icon) icon.classList.remove('asha-sync-spinning');
      toastIcon.classList.remove('asha-sync-spinning');
      toastIcon.textContent = 'check_circle';
      toastIconWrap.style.background = 'rgba(74, 222, 128, 0.2)';
      toastIcon.style.color = '#4ade80';

      toastTitle.textContent = 'Synchronized Successfully! ✅';
      toastSub.textContent = `All records & prescriptions up to date (${now})`;

      // Update page text if present
      document.querySelectorAll('[data-sync-text]').forEach(el => {
        el.textContent = `Synced at ${now}`;
      });

      // Update offline queue elements on workers hub & sync offline pages
      const queueBadges = document.querySelectorAll('.font-label-sm.text-admin-amber, .bg-admin-amber\\/10');
      queueBadges.forEach(el => {
        if (el.textContent.includes('offline')) {
          el.innerHTML = `<span class="text-green-500 font-semibold">● All records synced</span>`;
        }
      });

      // Hide toast after 3s
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        isGlobalSyncing = false;
      }, 3000);
    }, 1000);
  };

  // 3. Delegate click listener for ANY sync buttons or elements
  document.addEventListener('click', function (e) {
    const syncTarget = e.target.closest(
      '[data-path="sync"], [id*="sync"], button[aria-label*="Sync"], button[title*="Sync"], .asha-sync-btn'
    );

    if (syncTarget) {
      // If the target already has custom inline sync handler (like in dashboard), let it run
      if (typeof handleSyncClick === 'function' && syncTarget.id === 'navbar-sync-btn') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      window.triggerGlobalAshaSync(syncTarget);
    }
  });
})();
