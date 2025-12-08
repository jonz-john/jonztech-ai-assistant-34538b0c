// Anti-inspect and anti-copy protections
// Check if developer mode is enabled
const isDeveloperModeEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem('jonztech_developer_mode');
    return stored === 'true';
  } catch {
    return false;
  }
};

export const setDeveloperModeFlag = (enabled: boolean) => {
  try {
    if (enabled) {
      localStorage.setItem('jonztech_developer_mode', 'true');
    } else {
      localStorage.removeItem('jonztech_developer_mode');
    }
  } catch {
    // Ignore storage errors
  }
};

export const initAntiInspect = () => {
  // Disable right-click context menu (unless developer mode)
  document.addEventListener('contextmenu', (e) => {
    if (isDeveloperModeEnabled()) return true;
    e.preventDefault();
    return false;
  });

  // Disable keyboard shortcuts for dev tools (unless developer mode)
  document.addEventListener('keydown', (e) => {
    if (isDeveloperModeEnabled()) return true;
    
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Dev tools)
    if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U (View source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }

    // Ctrl+S (Save page)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      return false;
    }
  });

  // Disable text selection on certain elements (unless developer mode)
  document.addEventListener('selectstart', (e) => {
    if (isDeveloperModeEnabled()) return true;
    
    const target = e.target as HTMLElement;
    // Allow selection in input fields and textareas
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return true;
    }
    // Prevent selection elsewhere
    if (!target.closest('[data-allow-select]')) {
      e.preventDefault();
      return false;
    }
  });

  // Disable drag on images (unless developer mode)
  document.addEventListener('dragstart', (e) => {
    if (isDeveloperModeEnabled()) return true;
    if ((e.target as HTMLElement).tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });

  // Console warning
  console.clear();
  console.log('%c⚠️ Warning!', 'color: red; font-size: 32px; font-weight: bold;');
  console.log('%cThis is a protected application. Unauthorized access or inspection is prohibited.', 'color: red; font-size: 14px;');
  console.log('%c© JonzTech AI Labs LLC. All rights reserved.', 'color: gray; font-size: 12px;');

  // Detect dev tools (basic detection) - skip if developer mode enabled
  const detectDevTools = () => {
    if (isDeveloperModeEnabled()) return;
    
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      document.body.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #1a1a2e; color: white; font-family: system-ui;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">⚠️ Developer Tools Detected</h1>
          <p style="color: #888;">Please close developer tools to continue using JonzTech AI.</p>
        </div>
      `;
    }
  };

  // Check periodically
  setInterval(detectDevTools, 1000);
};
