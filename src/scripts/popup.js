document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('formPopup');
  const openButtons = document.querySelectorAll('.form-popup');
  const closeButton = popup.querySelector('.popup__close');
  const backdrop = popup.querySelector('.popup__backdrop');
    
  function openPopup() {
    popup.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    popup.setAttribute('aria-hidden', 'false');
  }

  function closePopup() {
    popup.classList.remove('is-open');
    document.body.style.overflow = '';
    popup.setAttribute('aria-hidden', 'true');
  }

  openButtons.forEach((button) => {
    button.addEventListener('click', openPopup);
  });

  closeButton.addEventListener('click', closePopup);
  backdrop.addEventListener('click', closePopup);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && popup.classList.contains('is-open')) {
      closePopup();
    }
  });
});