document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('formPopup');
  if (!(popup instanceof HTMLDialogElement)) return;
  let opener;
  document.querySelectorAll('.form-popup').forEach((button) => {
    button.addEventListener('click', () => {
      if (popup.open) return;
      // The menu may have just closed; return to its visible trigger afterwards.
      opener = button.closest('#siteMenu')
        ? document.querySelector('.header-burger') : button;
      popup.showModal();
      popup.classList.add('is-open');
      document.documentElement.classList.add('contact-popup-open');
      popup.querySelector('input')?.focus({ preventScroll: true });
    });
  });
  popup.querySelector('.popup__close')?.addEventListener('click', () => popup.close());
  let backdropPress = false;
  popup.addEventListener('pointerdown', (event) => {
    backdropPress = event.target === popup;
  });
  popup.addEventListener('click', (event) => {
    if (backdropPress && event.target === popup) popup.close();
    backdropPress = false;
  });
  popup.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...popup.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), iframe, [tabindex="0"]')]
      .filter(element => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  popup.addEventListener('close', () => {
    popup.classList.remove('is-open');
    document.documentElement.classList.remove('contact-popup-open');
    opener?.focus({ preventScroll: true });
  });
});
