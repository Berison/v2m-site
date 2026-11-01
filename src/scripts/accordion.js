document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.team-list-item').forEach((item) => {
    const button = item.querySelector('.team-list-item__toggle');
    const content = item.querySelector('.team-list-item__content');
    if (!button || !content) return;

    const setExpanded = (expanded) => {
      button.setAttribute('aria-expanded', String(expanded));
      item.classList.toggle('is-open', expanded);
      content.hidden = !expanded;
    };

    setExpanded(button.getAttribute('aria-expanded') === 'true');
    button.addEventListener('click', () => {
      setExpanded(button.getAttribute('aria-expanded') !== 'true');
    });
  });
});
