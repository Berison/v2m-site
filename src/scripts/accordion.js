document.addEventListener('DOMContentLoaded', () => {
  const accordionItems = document.querySelectorAll('.team-list-item');

  accordionItems.forEach((item) => {
    const button = item.querySelector('.team-list-item__toggle');
    const content = item.querySelector('.team-list-item__content');

    if (!button || !content) return;

    content.addEventListener('transitionend', (event) => {
      if (
        event.target === content &&
        event.propertyName === 'max-height' &&
        item.classList.contains('is-open')
      ) {
        content.style.maxHeight = 'none';
      }
    });

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      if (isOpen) {
        content.style.maxHeight = `${content.scrollHeight}px`;

        void content.offsetHeight;

        item.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = '0px';
      } else {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = `${content.scrollHeight}px`;
      }
    });
  });
});