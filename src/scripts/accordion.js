document.addEventListener('DOMContentLoaded', () => {
  const accordionItems = document.querySelectorAll('.team-list-item');

  accordionItems.forEach((item) => {
    const button = item.querySelector('.team-list-item__toggle');
    const content = item.querySelector('.team-list-item__content');
    const inner = item.querySelector('.team-list-item__content-inner');

    if (!button || !content || !inner) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      if (isOpen) {
        content.style.maxHeight = `${content.scrollHeight}px`;

        requestAnimationFrame(() => {
          item.classList.remove('is-open');
          button.setAttribute('aria-expanded', 'false');
          content.style.maxHeight = '0px';
        });
      } else {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = `${inner.scrollHeight + 40}px`;
      }
    });
  });
});