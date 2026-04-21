import './styles/main.scss';
import './scripts/accordion';
import './scripts/popup';
import './scripts/game';
import LocomotiveScroll from 'locomotive-scroll';
import { CountUp } from 'countup.js';
import 'locomotive-scroll/dist/locomotive-scroll.css';

/**
 * Updates the visual progress fill for a range input.
 */
function updateProgressFill(progress, percent) {
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

  cards.forEach((card) => {
    const button = card.querySelector('.play-button');
    const audio = card.querySelector('.game-audio');
    const progress = card.querySelector('.sound-progress');

    if (!button || !audio || !progress) {
      return;
    }

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
      button.classList.add('is-playing');
      button.classList.remove('is-paused');
    });

    /**
     * Updates the button when audio is paused.
     */
    audio.addEventListener('pause', () => {
      button.classList.remove('is-playing');
      button.classList.add('is-paused');
    });

    /**
     * Initializes progress UI when metadata is loaded.
     */
    audio.addEventListener('loadedmetadata', () => {
      progress.value = '0';
      updateProgressFill(progress, 0);
    });

    /**
     * Resets UI when playback ends.
     */
    audio.addEventListener('ended', () => {
      button.classList.remove('is-playing');
      button.classList.add('is-paused');
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

  let cursorX = mouseX;
  let cursorY = mouseY;

  let dotX = mouseX;
  let dotY = mouseY;

  let rafId = null;

  const interactiveSelector =
    'a, button, .magnetic, [data-cursor-hover], input, textarea, select';

  const magneticItems = document.querySelectorAll('.magnetic');

  const showCursor = () => {
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
    showCursor();

    const target = e.target.closest(interactiveSelector);
    cursor.classList.toggle('is-hover', !!target);
  };

  const animate = () => {
    cursorX += (mouseX - cursorX) * 0.38;
    cursorY += (mouseY - cursorY) * 0.38;

    dotX += (mouseX - dotX) * 0.56;
    dotY += (mouseY - dotY) * 0.56;

    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

    rafId = requestAnimationFrame(animate);
  };

  document.addEventListener('mousemove', onMouseMove);

  document.addEventListener('mousedown', () => {
    cursor.classList.add('is-pressed');
  });

  document.addEventListener('mouseup', () => {
    cursor.classList.remove('is-pressed');
  });

  document.addEventListener('mouseleave', hideCursor);
  document.addEventListener('mouseenter', showCursor);

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

  animate();

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const scroll = new LocomotiveScroll({
    el: document.querySelector('[data-scroll-container]'),
    smooth: true,
  });

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

  initProCursor();

  const forms = document.querySelectorAll('.footer-form');

  const messages = {
    name: {
      valueMissing: 'Enter your name',
      tooShort: 'Minimum 2 characters',
    },
    email: {
      valueMissing: 'Enter email',
      typeMismatch: 'Invalid email',
    },
    company: {
      valueMissing: 'Enter company',
      tooShort: 'Minimum 2 characters',
    },
    message: {
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
      field.classList.remove('is-invalid');
      errorEl.textContent = '';
      return true;
    }

    field.classList.add('is-invalid');
    errorEl.textContent = getError(input);
    return false;
  };

  forms.forEach((form) => {
    const inputs = form.querySelectorAll('input');
    const statusEl = form.querySelector('.footer-form__status');
    const btn = form.querySelector('.footer-form__button');

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

      let isValid = true;

      inputs.forEach((input) => {
        if (!validateField(input)) isValid = false;
      });

      const captchaToken =
        typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';

      if (!isValid) {
        form.classList.add('is-error');
        form.classList.remove('is-success');
        if (statusEl) statusEl.textContent = 'Fill all fields correctly';
        return;
      }

      if (!captchaToken) {
        form.classList.add('is-error');
        form.classList.remove('is-success');
        if (statusEl) statusEl.textContent = 'Please complete the captcha';
        return;
      }

      const formData = new FormData(form);
      formData.append('action', 'contact-form');

      try {
        btn.disabled = true;
        btn.textContent = 'Sending...';


        const response = await fetch('/send2.php', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Captcha verification failed');
        }

        form.classList.add('is-success');
        form.classList.remove('is-error');
        if (statusEl) statusEl.textContent = 'Sent successfully';
        form.reset();

        if (typeof grecaptcha !== 'undefined') {
          grecaptcha.reset();
        }
      } catch (err) {
        form.classList.add('is-error');
        form.classList.remove('is-success');
        if (statusEl) statusEl.textContent = err.message || 'Error. Try again';
        console.error(err);

        if (typeof grecaptcha !== 'undefined') {
          grecaptcha.reset();
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send';
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