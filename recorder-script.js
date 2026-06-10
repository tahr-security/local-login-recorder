// Injected into the page to capture user interactions
(function () {
  function recordStep(step) {
    if (typeof window.__recordStep__ === 'function') {
      window.__recordStep__(step);
    } else {
      console.log('[RECORDER]', step.action, step.selector, step.fieldType || '');
    }
  }

  function getSelector(el) {
    if (el.id) return `#${el.id}`;

    if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;

    if (el.tagName === 'INPUT' && el.type) {
      return `input[type="${el.type}"]`;
    }

    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).join('.');
      if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
    }

    return el.tagName.toLowerCase();
  }

  function getFieldType(el) {
    const type = el.type?.toLowerCase() || '';
    const name = el.name?.toLowerCase() || '';
    const id = el.id?.toLowerCase() || '';
    const placeholder = el.placeholder?.toLowerCase() || '';
    const autocomplete = el.autocomplete?.toLowerCase() || '';

    if (type === 'password') return 'password';

    if (type === 'email') return 'username';
    if (name.includes('email') || id.includes('email') || placeholder.includes('email')) return 'username';
    if (name.includes('user') || id.includes('user') || placeholder.includes('user')) return 'username';
    if (autocomplete.includes('email') || autocomplete.includes('username')) return 'username';

    return 'other';
  }

  function shouldSkipClick(el) {
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;

    var type = (el.type || 'text').toLowerCase();
    return ['submit', 'button', 'image', 'checkbox', 'radio'].indexOf(type) === -1;
  }

  document.addEventListener(
    'change',
    (e) => {
      const el = e.target;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        recordStep({
          action: 'fill',
          selector: getSelector(el),
          fieldType: getFieldType(el),
          timestamp: Date.now(),
        });
      }
    },
    true,
  );

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target;

      if (shouldSkipClick(el)) return;

      let clickTarget = el;
      if (!['BUTTON', 'A', 'SUBMIT'].includes(el.tagName)) {
        const parent = el.closest('button, a, [role="button"]');
        if (parent) clickTarget = parent;
      }

      recordStep({
        action: 'click',
        selector: getSelector(clickTarget),
        text: clickTarget.textContent?.trim().slice(0, 50) || '',
        tagName: clickTarget.tagName.toLowerCase(),
        timestamp: Date.now(),
      });
    },
    true,
  );

  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      recordStep({
        action: 'navigate',
        url: window.location.href,
        timestamp: Date.now(),
      });
      lastUrl = window.location.href;
    }
  };

  setInterval(checkUrlChange, 500);
  window.addEventListener('popstate', checkUrlChange);

  console.log('[RECORDER] Script injected and ready');
})();
