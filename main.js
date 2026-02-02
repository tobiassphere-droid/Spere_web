// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const faqItem = button.parentElement;
    const answer = button.nextElementSibling;

    // Toggle active state
    button.classList.toggle('active');

    // Animate height
    if (button.classList.contains('active')) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
    } else {
      answer.style.maxHeight = 0;
    }
  });
});

// Smooth Scroll for Anchor Links (Polyfill-like behavior for full support)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Modal Logic - DEAKTIVIERT (Nutzt jetzt termin.html)
/*
const modal = document.getElementById('booking-modal');
const closeBtn = document.querySelector('.close-modal');
...
*/

// Scroll Animation Observer
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('scroll-show');
    }
  });
}, observerOptions);

const hiddenElements = document.querySelectorAll('.scroll-hidden');
if (hiddenElements.length > 0) {
  hiddenElements.forEach((el) => observer.observe(el));
} else {
  console.warn('No .scroll-hidden elements found');
}

// Fallback: If intersection observer is not supported or fails, show elements after delay
setTimeout(() => {
  document.querySelectorAll('.scroll-hidden:not(.scroll-show)').forEach(el => {
    el.classList.add('scroll-show');
  });
}, 2000);

// ==========================================
// Interactive Sphere Pills
// ==========================================
const spherePills = document.querySelectorAll('.sphere-pill[data-use-case]');
let activePill = null;

spherePills.forEach(pill => {
  pill.addEventListener('click', () => {
    // Remove active class from all pills
    spherePills.forEach(p => p.classList.remove('active'));

    // Add active class to clicked pill
    pill.classList.add('active');
    activePill = pill;

    // Get use case type
    const useCase = pill.dataset.useCase;

    // Visual feedback - subtle pulse
    pill.style.transform = 'translateY(-3px) scale(1.03)';
    setTimeout(() => {
      pill.style.transform = '';
    }, 200);

    // Log for future content switching
    console.log(`Use case selected: ${useCase}`);
  });
});

// ==========================================
// Electrifying CTA Hover Effect
// ==========================================
const ctaTriggers = [
  '.btn-pill', // "Contact Us"
  '.btn-primary', // "Erstgespräch / Bewerben"
  '.btn-large'
];

ctaTriggers.forEach(selector => {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (typeof window.isCtaHovered !== 'undefined') {
        window.isCtaHovered = true;
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (typeof window.isCtaHovered !== 'undefined') {
        window.isCtaHovered = false;
      }
    });
  });
});

console.log('sphere. Landing Page Loaded');

// ==========================================
// Contact Overlay & Multi-Step Form Logic
// ==========================================
const contactOverlay = document.getElementById('contact-overlay');
const contactBtn = document.querySelector('.btn-pill'); // "Contact Us"
const closeOverlayBtn = document.getElementById('close-overlay');
const auditForm = document.getElementById('audit-form');

// Open Overlay
if (contactBtn && contactOverlay) {
  contactBtn.addEventListener('click', (e) => {
    e.preventDefault();
    contactOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll
  });
} else {
  console.error('Contact button or overlay not found', { contactBtn, contactOverlay });
}

// Close Overlay
if (closeOverlayBtn && contactOverlay) {
  closeOverlayBtn.addEventListener('click', () => {
    contactOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
  });
}

// Close on escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && contactOverlay.classList.contains('active')) {
    contactOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Multi-Step Navigation
const formSteps = document.querySelectorAll('.form-step');
const stepNums = document.querySelectorAll('.step-num');
const btnNext = document.querySelector('.btn-next');
const btnBack = document.querySelector('.btn-back');
const btnSubmit = document.querySelector('.btn-submit');
const progressBar = document.querySelector('.progress-bar');
let currentStep = 1;
const totalSteps = formSteps.length;

function updateStepVisibility() {
  formSteps.forEach(step => {
    step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
  });

  stepNums.forEach((num, index) => {
    num.classList.toggle('active', index + 1 <= currentStep);
  });

  // Update Progress Bar
  const progressPercent = (currentStep / totalSteps) * 100;
  if (progressBar) {
    progressBar.style.setProperty('--progress-width', `${progressPercent}%`);
  }

  // Dynamic CSS variable for progress
  document.documentElement.style.setProperty('--form-progress-width', `${progressPercent}%`);

  const barAfter = document.querySelector('.progress-bar');
  if (barAfter) {
    barAfter.style.setProperty('--progress', `${progressPercent}%`);
  }

  // Button visibility
  btnBack.style.display = currentStep > 1 ? 'block' : 'none';
  btnNext.style.display = currentStep < totalSteps ? 'block' : 'none';
  btnSubmit.style.display = currentStep === totalSteps ? 'block' : 'none';
}

if (btnNext) {
  btnNext.addEventListener('click', () => {
    // Validate current step inputs
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = currentStepEl.querySelectorAll('input, textarea, select');
    let isValid = true;
    let firstInvalidInput = null;

    // Reset previous error states
    currentStepEl.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    currentStepEl.querySelectorAll('.error-message').forEach(el => el.remove());

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        isValid = false;

        // Add visual error class
        input.classList.add('input-error');

        // Handle Radio Buttons (highlight container)
        if (input.type === 'radio') {
          const radioOption = input.closest('.radio-option') || input.parentElement;
          if (radioOption) radioOption.classList.add('input-error');
        }

        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }
      } else {
        input.classList.remove('input-error');
        if (input.type === 'radio') {
          const radioOption = input.closest('.radio-option') || input.parentElement;
          if (radioOption) radioOption.classList.remove('input-error');
        }
      }
    });

    if (isValid) {
      if (currentStep < totalSteps) {
        currentStep++;
        updateStepVisibility();
      }
    } else {
      // Focus/Scroll to first invalid input
      if (firstInvalidInput) {
        firstInvalidInput.reportValidity();
        // Fallback shake animation or focus if reportValidity doesn't show
        firstInvalidInput.focus();

        // Add shake effect to form
        const currentGroup = firstInvalidInput.closest('.form-group');
        if (currentGroup) {
          currentGroup.classList.add('shake');
          setTimeout(() => currentGroup.classList.remove('shake'), 500);
        }
      }
    }
  });
}

if (btnBack) {
  btnBack.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateStepVisibility();
    }
  });
}

// Form Submission (n8n Webhook Integration)
if (auditForm) {
  auditForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Visual feedback for submission
    btnSubmit.disabled = true;
    const originalBtnText = btnSubmit.innerText;
    btnSubmit.innerText = 'Wird gesendet...';

    // Collect Form Data
    const formData = {
      gymName: document.getElementById('gym-name').value,
      contactName: document.getElementById('contact-name').value,
      locations: auditForm.querySelector('input[name="entry.placeholder3"]:checked')?.value,
      techStack: document.getElementById('tech-stack').value,
      painPoint: document.getElementById('pain-point').value,
      leadSpeed: auditForm.querySelector('input[name="entry.placeholder6"]:checked')?.value,
      email: document.getElementById('contact-email').value,
      submittedAt: new Date().toISOString()
    };

    const N8N_WEBHOOK_URL = 'https://n8n.srv1171616.hstgr.cloud/webhook-test/d4bf3ee6-fe56-4937-b8a8-e835ec887c47';

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        btnSubmit.innerText = 'Gesendet!';
        btnSubmit.style.backgroundColor = '#10b981';

        setTimeout(() => {
          contactOverlay.classList.remove('active');
          document.body.style.overflow = '';
          currentStep = 1;
          updateStepVisibility();
          auditForm.reset();
          btnSubmit.disabled = false;
          btnSubmit.innerText = originalBtnText;
          btnSubmit.style.backgroundColor = '';
        }, 2000);
      } else {
        throw new Error('Server respondierte mit Fehler');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      btnSubmit.innerText = 'Fehler! Neuladen...';
      btnSubmit.style.backgroundColor = '#ef4444';

      setTimeout(() => {
        btnSubmit.disabled = false;
        btnSubmit.innerText = originalBtnText;
        btnSubmit.style.backgroundColor = '';
      }, 3000);
    }
  });
}
