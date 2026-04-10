import './styles/main.scss';
import './scripts/accordion';

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