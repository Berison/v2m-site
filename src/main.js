import './styles/main.scss';
import './scripts/accordion';
import './scripts/popup';
import './scripts/game';
import './scripts/accessibility';
import { initRecaptcha, getCaptchaResponse, resetCaptcha } from './scripts/recaptcha';
import LocomotiveScroll from 'locomotive-scroll';
import { CountUp } from 'countup.js';
import 'locomotive-scroll/dist/locomotive-scroll.css';

function initSubscribePopup() {
  const dialog = document.querySelector('#subscribePopup');
  const form = dialog?.querySelector('.subscribe-form');
  const closeButton = dialog?.querySelector('.newsletter-popup__close');

  if (!dialog || !form || !closeButton) return;

  const emailInput = form.querySelector('[name="email"]');
  const submitButton = form.querySelector('[type="submit"]');
  const status = form.querySelector('.subscribe-form__status');

  let isSubmitting = false;
  let backdropPress = false;

  document.querySelectorAll('.subscribe-popup').forEach((button) => {
    button.addEventListener('click', () => {
      if (dialog.open) return;

      dialog.showModal();
      document.documentElement.classList.add('subscribe-popup-open');
      emailInput.focus({ preventScroll: true });
    });
  });

  closeButton.addEventListener('click', () => dialog.close());

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('subscribe-popup-open');
  });

  dialog.addEventListener('pointerdown', (event) => {
    backdropPress = event.target === dialog;
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && backdropPress) {
      dialog.close();
    }

    backdropPress = false;
  });

  const showStatus = (message, type) => {
    status.textContent = message;
    status.classList.toggle('is-error', type === 'error');
    status.classList.toggle('is-success', type === 'success');
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting || !form.reportValidity()) return;

    const { token, error: captchaError } = getCaptchaResponse(form);
    if (captchaError) {
      showStatus(captchaError, 'error');
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing…';
    showStatus('', '');

    const data = new FormData();
    data.set('email', emailInput.value.trim());
    data.set('g-recaptcha-response', token);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: {
          Accept: 'application/json',
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message ||
          'Could not complete your request. Please try again later.',
        );
      }

      showStatus(
        result.message ||
        'Check your inbox to confirm your subscription.',
        'success',
      );

      form.reset();
    } catch (error) {
      showStatus(
        error instanceof Error && error.message !== 'Failed to fetch'
          ? error.message
          : 'Could not connect. Please try again later.',
        'error',
      );
    } finally {
      resetCaptcha(form);
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = 'Subscribe';
    }
  });
}

/**
 * Updates the visual progress fill for a range input.
 */
function updateProgressFill(progress, percent) {
  progress.style.setProperty('--playback-progress', `${percent}%`);
  progress.style.background = `linear-gradient(
    to right,
    #9cd874 ${percent}%,
    #cfcfc4 ${percent}%
  )`;
}

/**
 * Initializes all sound cards on the page.
 */
function initSoundCards() {
  const cards = document.querySelectorAll('.sound-card');

  cards.forEach((card, index) => {
    const button = card.querySelector('.play-button');
    const audio = card.querySelector('.game-audio');
    const progress = card.querySelector('.sound-progress');

    if (!button || !audio || !progress) {
      return;
    }

    const soundName = `Sound ${index + 1}`;
    const formatTime = (seconds) =>
      `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    const updateTime = () => {
      if (Number.isFinite(audio.duration)) {
        progress.setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} of ${formatTime(audio.duration)}`);
      }
    };
    audio.volume = 1;
    audio.muted = false;

    button.classList.add('is-paused');
    updateProgressFill(progress, 0);

    /**
     * Toggles play/pause for the current audio.
     */
    button.addEventListener('click', async () => {
      if (audio.paused) {
        stopAllAudios(audio);

        try {
          await audio.play();
        } catch (err) {
          console.warn('Audio play failed:', err);
        }
      } else {
        audio.pause();
      }
    });

    /**
     * Updates the button when audio starts playing.
     */
    audio.addEventListener('play', () => {
      button.setAttribute('aria-label', `Pause ${soundName}`);
      button.classList.add('is-playing');
      button.classList.remove('is-paused');
    });

    /**
     * Updates the button when audio is paused.
     */
    audio.addEventListener('pause', () => {
      button.setAttribute('aria-label', `Play ${soundName}`);
      button.classList.remove('is-playing');
      button.classList.add('is-paused');
    });

    /**
     * Initializes progress UI when metadata is loaded.
     */
    audio.addEventListener('loadedmetadata', () => {
      updateTime();
      progress.value = '0';
      updateProgressFill(progress, 0);
    });

    /**
     * Resets UI when playback ends.
     */
    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      button.setAttribute('aria-label', `Play ${soundName}`);
      button.classList.remove('is-playing');
      button.classList.add('is-paused');
      updateTime();
      progress.value = '0';
      updateProgressFill(progress, 0);
    });

    /**
     * Updates progress bar during playback.
     */
    audio.addEventListener('timeupdate', () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      const percent = (audio.currentTime / audio.duration) * 100;
      progress.value = String(percent);
      updateTime();
      updateProgressFill(progress, percent);
    });

    /**
     * Seeks audio when the user moves the progress bar.
     */
    progress.addEventListener('input', () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      const percent = Number(progress.value);
      audio.currentTime = (percent / 100) * audio.duration;
      updateTime();
      updateProgressFill(progress, percent);
    });
  });
}

/**
 * Pauses all audios except the current one.
 */
function stopAllAudios(currentAudio) {
  document.querySelectorAll('.game-audio').forEach((audio) => {
    if (audio !== currentAudio && !audio.paused) {
      audio.pause();
    }
  });
}

document.addEventListener('DOMContentLoaded', initSoundCards);

function initProCursor() {
  const isDesktop = window.matchMedia('(min-width: 1025px)').matches;
  if (!isDesktop) return;

  const cursor = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor-dot');

  if (!cursor || !dot) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  let dotX = mouseX;
  let dotY = mouseY;

  let rafId = null;
  let isOverIframe = false;

  const interactiveSelector =
    'a, button, .magnetic, [data-cursor-hover], input, textarea, select';

  const magneticItems = document.querySelectorAll('.magnetic');
  const iframeZones = document.querySelectorAll('.iframe-cursor-zone');

  const showCursor = () => {
    if (isOverIframe) return;
    cursor.classList.add('is-visible');
    dot.classList.add('is-visible');
  };

  const hideCursor = () => {
    cursor.classList.remove('is-visible');
    dot.classList.remove('is-visible');
  };

  const onMouseMove = e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isOverIframe) {
      showCursor();
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

      const target = e.target.closest(interactiveSelector);
      cursor.classList.toggle('is-hover', !!target);
    }
  };

  const animate = () => {
    dotX += (mouseX - dotX) * 0.65;
    dotY += (mouseY - dotY) * 0.65;

    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

    rafId = requestAnimationFrame(animate);
  };

  document.addEventListener('mousemove', onMouseMove);

  document.addEventListener('mousedown', () => {
    if (!isOverIframe) cursor.classList.add('is-pressed');
  });

  document.addEventListener('mouseup', () => {
    cursor.classList.remove('is-pressed');
  });

  document.addEventListener('mouseleave', hideCursor);

  document.addEventListener('mouseenter', () => {
    if (!isOverIframe) showCursor();
  });

  magneticItems.forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;

      item.style.transform = `translate(${relX * 0.18}px, ${relY * 0.18}px)`;
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translate(0, 0)';
    });
  });

  iframeZones.forEach(zone => {
    zone.addEventListener('mouseenter', () => {
      isOverIframe = true;
      hideCursor();
    });

    zone.addEventListener('mouseleave', () => {
      isOverIframe = false;
      showCursor();
    });
  });

  animate();

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
  });
}

function initSiteMenu(scroll) {
  const trigger = document.querySelector('.header-burger');
  const dialog = document.querySelector('#siteMenu');
  const closeButton = dialog?.querySelector('.site-menu__close');
  const formPopup = document.querySelector('#formPopup');
  const subscribePopup = document.querySelector('#subscribePopup');

  if (!trigger || !dialog || !closeButton) return;

  let scrollLocked = false;

  const syncScroll = () => {
    const shouldLock =
      dialog.open ||
      Boolean(formPopup?.open) ||
      Boolean(subscribePopup?.open);

    if (shouldLock === scrollLocked) return;

    scrollLocked = shouldLock;

    if (shouldLock) {
      scroll.stop();
    } else {
      scroll.start();
    }
  };

  const syncMenuState = () => {
    trigger.setAttribute('aria-expanded', String(dialog.open));

    document.documentElement.classList.toggle(
      'site-menu-open',
      dialog.open,
    );

    syncScroll();
  };

  const closeMenu = () => {
    if (!dialog.open) return;

    dialog.close();
    trigger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('site-menu-open');

    queueMicrotask(syncScroll);
  };

  trigger.addEventListener('click', () => {
    if (dialog.open) return;

    dialog.showModal();
    syncMenuState();
  });

  closeButton.addEventListener('click', closeMenu);

  dialog.addEventListener('close', syncMenuState);

  let pointerStartedOnBackdrop = false;

  dialog.addEventListener('pointerdown', (event) => {
    pointerStartedOnBackdrop = event.target === dialog;
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && pointerStartedOnBackdrop) {
      closeMenu();
    }

    pointerStartedOnBackdrop = false;
  });

  dialog.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Element)) return;

      const action = event.target.closest(
        '.site-menu__nav a, .site-menu__nav .form-popup',
      );

      if (action) closeMenu();
    },
    true,
  );

  if (formPopup) {
    const observer = new MutationObserver(syncScroll);

    observer.observe(formPopup, {
      attributes: true,
      attributeFilter: ['open'],
    });
  }

  if (subscribePopup) {
    const observer = new MutationObserver(syncScroll);

    observer.observe(subscribePopup, {
      attributes: true,
      attributeFilter: ['open'],
    });
  }

  dialog.querySelectorAll('.site-menu__nav a').forEach((link) => {
    const path = new URL(link.href).pathname;

    if (path === window.location.pathname) {
      link.setAttribute('aria-current', 'page');
    }
  });

  syncMenuState();

  const desktopMenuQuery = window.matchMedia('(min-width: 1101px)');

  const syncMenuBreakpoint = () => {
    if (desktopMenuQuery.matches && dialog.open) {
      closeMenu();
    }
  };

  desktopMenuQuery.addEventListener('change', syncMenuBreakpoint);
  syncMenuBreakpoint();
}

function initNavigationActiveState() {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

  document
    .querySelectorAll('.header-nav a, .site-menu__nav a')
    .forEach((link) => {
      const linkPath = new URL(link.href).pathname;
      const isExactPage = currentPath === linkPath;

      const isProductArticle =
        linkPath === '/product.html' &&
        currentPath.startsWith('/product/');

      link.classList.toggle('active', isExactPage || isProductArticle);

      if (isExactPage) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
}

function initYoutubePreviews() {
  document.querySelectorAll('[data-youtube]').forEach((block) => {
    const button = block.querySelector('.video-preview');
    const videoId = block.dataset.youtube;

    if (!button || !videoId) return;

    button.addEventListener(
      'click',
      () => {
        const iframe = document.createElement('iframe');

        iframe.className = 'video-iframe';
        iframe.title = 'V2M video — YouTube';
        iframe.src =
          `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` +
          '?autoplay=1&playsinline=1';

        iframe.allow =
          'accelerometer; autoplay; clipboard-write; encrypted-media; ' +
          'gyroscope; picture-in-picture; web-share';

        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;

        button.replaceWith(iframe);
        iframe.focus({ preventScroll: true });
      },
      { once: true },
    );
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initRecaptcha();
  const scroll = new LocomotiveScroll({
    el: document.querySelector('[data-scroll-container]'),
    smooth: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  initSiteMenu(scroll);
  initSubscribePopup();
  initNavigationActiveState()
  initYoutubePreviews();

  const counterEl = document.querySelector('#stats-count');

  if (counterEl) {
    const counter = new CountUp(counterEl, 1250, {
      duration: 2.5,
      separator: ' ',
    });

    if (!counter.error) {
      counter.start();
    } else {
      console.error(counter.error);
    }
  }

  const cards = document.querySelectorAll('.benefit-card');

  cards.forEach(card => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const numbers = card.querySelectorAll('.benefit-card__stat-value span:not(.not)');

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          observer.disconnect();
          return;
        }
        numbers.forEach(el => {
          const value = el.innerText.replace('%', '').replace('x', '');

          const count = new CountUp(el, value, {
            duration: 2,
            suffix: el.innerText.includes('%') ? '%' : '',
            prefix: el.innerText.includes('x') ? 'x' : '',
          });

          count.start();
        });

        observer.disconnect();
      }
    });

    observer.observe(card);
  });

  // initProCursor();

  const forms = document.querySelectorAll('.footer-form');

  const messages = {
    name: {
      label: 'Full name',
      valueMissing: 'Enter your name',
      tooShort: 'Minimum 2 characters',
    },
    email: {
      label: 'Email',
      valueMissing: 'Enter email',
      typeMismatch: 'Invalid email',
    },
    company: {
      label: 'Company',
      valueMissing: 'Enter company',
      tooShort: 'Minimum 2 characters',
    },
    message: {
      label: 'Message',
      valueMissing: 'Enter message',
      tooShort: 'Minimum 10 characters',
    },
  };

  const getError = (input) => {
    const config = messages[input.name];

    if (input.validity.valueMissing) return config.valueMissing;
    if (input.validity.typeMismatch) return config.typeMismatch;
    if (input.validity.tooShort) return config.tooShort;

    return 'Invalid field';
  };

  const validateField = (input) => {
    const field = input.closest('.footer-field');
    const errorEl = field.querySelector('.footer-field__error');

    if (input.validity.valid) {
      input.removeAttribute('aria-invalid');
      field.classList.remove('is-invalid');
      errorEl.textContent = '';
      return true;
    }

    input.setAttribute('aria-invalid', 'true');
    field.classList.add('is-invalid');
    errorEl.textContent = getError(input);
    return false;
  };

  forms.forEach((form) => {
    const inputs = form.querySelectorAll('.footer-field input');
    const statusEl = form.querySelector('.footer-form__status');
    const buttons = form.querySelectorAll('.footer-form__button');
    let isSubmitting = false;

    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        validateField(input);
        form.classList.remove('is-error', 'is-success');
        if (statusEl) statusEl.textContent = '';
      });

      input.addEventListener('blur', () => validateField(input));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const invalidInputs = [...inputs].filter((input) => !validateField(input));

      if (invalidInputs.length > 0) {
        form.classList.add('is-error');
        form.classList.remove('is-success');
        if (statusEl) {
          const fieldNames = invalidInputs.map((input) => messages[input.name].label);
          statusEl.textContent = invalidInputs.length === 1
            ? `Please check this field: ${fieldNames[0]}.`
            : `Please check these ${invalidInputs.length} fields: ${fieldNames.join(', ')}.`;
        }
        invalidInputs[0].focus();
        return;
      }

      const { token: captchaToken, error: captchaError } = getCaptchaResponse(form);
      if (captchaError) {
        form.classList.add('is-error');
        form.classList.remove('is-success');
        if (statusEl) statusEl.textContent = captchaError;
        return;
      }

      const formData = new FormData(form);
      formData.append('action', 'contact-form');
      formData.set('g-recaptcha-response', captchaToken);

      try {
        isSubmitting = true;
        form.setAttribute('aria-busy', 'true');
        buttons.forEach((button) => {
          // Keep keyboard focus while the submit guard prevents duplicate requests.
          button.setAttribute('aria-disabled', 'true');
          button.textContent = 'Sending...';
        });

        const response = await fetch('/send2.php', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        form.classList.add('is-success');
        form.classList.remove('is-error');
        if (statusEl) statusEl.textContent = 'Sent successfully';
        form.reset();

        resetCaptcha(form);
      } catch (err) {
        form.classList.add('is-error');
        form.classList.remove('is-success');
        if (statusEl) statusEl.textContent = err.message || 'Error. Try again';
        console.error(err);

        resetCaptcha(form);
      } finally {
        isSubmitting = false;
        form.removeAttribute('aria-busy');
        buttons.forEach((button) => {
          button.removeAttribute('aria-disabled');
          button.textContent = 'Send';
        });
      }
    });
  });

  // const video = document.querySelector('.video');
  // const btn = document.getElementById('playBtn');
  // const muteBtn = document.getElementById('muteBtn');

  // if (video && btn && muteBtn) {
  //   video.muted = false;
  //   // muteBtn.classList.add('is-muted');

  //   // play
  //   playBtn.addEventListener('click', async () => {
  //     if (video.paused) {
  //       await video.play();
  //     } else {
  //       video.pause();
  //     }
  //   });

  //   // sync play UI
  //   video.addEventListener('play', () => {
  //     playBtn.classList.add('is-playing');
  //   });

  //   video.addEventListener('pause', () => {
  //     playBtn.classList.remove('is-playing');
  //   });

  //   // mute toggle
  //   muteBtn.addEventListener('click', () => {
  //     video.muted = !video.muted;

  //     if (video.muted) {
  //       muteBtn.classList.add('is-muted');
  //     } else {
  //       muteBtn.classList.remove('is-muted');
  //     }
  //   });
  // }
});
