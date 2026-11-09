const SITE_KEY = '6LdoHHctAAAAAEtHnOQk7artruoIaoWxmMlF6mYG';
const LOAD_TIMEOUT = 15000;
const pendingForms = new WeakMap();
let apiPromise = null;
let loadAttempt = 0;

const messages = {
  loading: 'Loading verification…',
  required: 'Verification ready. Complete the checkbox.',
  verified: 'Verification complete.',
  expired: 'Verification expired. Complete the checkbox again.',
  error: 'Verification unavailable. Retry or email us.',
};

function setState(form, state) {
  form.dataset.captchaState = state;
  const status = form.querySelector('.captcha-feedback');
  if (status) {
    status.textContent = messages[state];
    status.classList.toggle('is-error', state === 'error' || state === 'expired');
  }
  if (state === 'verified') {
    const formStatus = form.querySelector('.footer-form__status, .subscribe-form__status');
    if (formStatus?.textContent === form.dataset.captchaSubmitError) {
      formStatus.textContent = '';
      formStatus.classList.remove('is-error');
      form.classList.remove('is-error');
    }
    delete form.dataset.captchaSubmitError;
  }

  const retry = form.querySelector('.captcha-retry');
  if (!retry) return;
  // Keep this control present so loading cannot move the submit button or focus.
  retry.textContent = state === 'loading' ? 'Loading verification…'
    : state === 'error' ? 'Retry verification' : 'Reload verification';
  if (state === 'loading') retry.setAttribute('aria-disabled', 'true');
  else retry.removeAttribute('aria-disabled');
}

function loadApi() {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (apiPromise) return apiPromise;

  const callback = `onV2MRecaptchaLoad${++loadAttempt}`;
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?onload=${callback}&render=explicit`;
  script.async = true;
  script.defer = true;

  apiPromise = new Promise((resolve, reject) => {
    const fail = () => {
      clearTimeout(timeout);
      delete window[callback];
      script.remove();
      reject(new Error('Verification failed to load'));
    };
    const timeout = setTimeout(fail, LOAD_TIMEOUT);
    window[callback] = () => {
      if (!window.grecaptcha?.render) {
        fail();
        return;
      }
      clearTimeout(timeout);
      delete window[callback];
      resolve(window.grecaptcha);
    };
    script.addEventListener('error', fail, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    apiPromise = null;
    throw error;
  });
  return apiPromise;
}

function prepareCaptcha(form, retry = false) {
  if (form.dataset.captchaId !== undefined) return Promise.resolve();
  if (pendingForms.has(form)) return pendingForms.get(form);
  if (form.dataset.captchaState === 'error' && !retry) return Promise.resolve();
  const container = form.querySelector('.g-recaptcha');
  if (!container) return Promise.resolve();

  setState(form, 'loading');
  const pending = loadApi().then((captcha) => {
    const id = captcha.render(container, {
      sitekey: SITE_KEY,
      size: container.dataset.size || 'normal',
      callback: () => setState(form, 'verified'),
      'expired-callback': () => setState(form, 'expired'),
      'error-callback': () => setState(form, 'error'),
    });
    form.dataset.captchaId = String(id);
    setState(form, 'required');
  }).catch(() => {
    setState(form, 'error');
  }).finally(() => pendingForms.delete(form));
  pendingForms.set(form, pending);
  return pending;
}

function submissionError(form, error) {
  form.dataset.captchaSubmitError = error;
  return { token: '', error };
}

export function getCaptchaResponse(form) {
  const id = form.dataset.captchaId;
  if (id !== undefined && window.grecaptcha?.getResponse) {
    try {
      const token = window.grecaptcha.getResponse(Number(id));
      if (token) {
        delete form.dataset.captchaSubmitError;
        return { token, error: '' };
      }
    } catch {
      setState(form, 'error');
    }
  }
  if (form.dataset.captchaState === 'error') {
    return submissionError(form, 'Verification is unavailable. Retry verification or email info@v2minc.com.');
  }
  if (id === undefined) {
    void prepareCaptcha(form);
    return submissionError(form, 'Verification is loading. Please wait a moment.');
  }
  return submissionError(form, form.dataset.captchaState === 'expired'
    ? 'Verification expired. Please complete the captcha again.' : 'Please complete the captcha');
}

export function resetCaptcha(form) {
  if (form.dataset.captchaId === undefined) return;
  try {
    window.grecaptcha.reset(Number(form.dataset.captchaId));
    setState(form, 'required');
  } catch {
    setState(form, 'error');
  }
}

export function initRecaptcha() {
  const forms = document.querySelectorAll('.footer-form, .subscribe-form');
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      void prepareCaptcha(entry.target.closest('form'));
    });
  }, { rootMargin: '200px 0px' }) : null;

  forms.forEach((form) => {
    form.addEventListener('focusin', () => void prepareCaptcha(form));
    const container = form.querySelector('.g-recaptcha');
    if (container) observer?.observe(container);
    form.querySelector('.captcha-retry')?.addEventListener('click', () => {
      if (form.dataset.captchaState === 'loading') return;
      if (form.dataset.captchaId !== undefined) resetCaptcha(form);
      else void prepareCaptcha(form, true);
    });
  });
}
