document.addEventListener('DOMContentLoaded', () => {
  // Explicit disclosures work with keyboard, mouse and touch, without hover traps.
  const dots = document.querySelectorAll('.home-page .dot');
  const closeDetails = () => dots.forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    const detail = document.getElementById(button.getAttribute('aria-controls'));
    if (detail) detail.hidden = true;
  });
  dots.forEach(button => {
    const detail = document.getElementById(button.getAttribute('aria-controls'));
    if (!detail) return;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      closeDetails();
      button.setAttribute('aria-expanded', String(!open));
      detail.hidden = open;
      if (!open) {
        // Clamp the description inside the viewport after its responsive positioning.
        detail.style.setProperty('--detail-shift', '0px');
        const rect = detail.getBoundingClientRect();
        const shift = rect.left < 12 ? 12 - rect.left : Math.min(0, innerWidth - 12 - rect.right);
        detail.style.setProperty('--detail-shift', `${shift}px`);
      }
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDetails();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.dot')) closeDetails();
  });
  window.addEventListener('resize', closeDetails);

  const video = document.querySelector('.home-page .hero__video');
  const toggle = document.querySelector('.motion-toggle');
  if (!video || !toggle) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  const sync = () => {
    const playing = !video.paused;
    toggle.textContent = playing ? 'Pause background animation' : 'Play background animation';
  };
  const play = () => video.play().catch(sync);
  toggle.addEventListener('click', () => {
    if (video.paused) { userPaused = false; void play(); }
    else { userPaused = true; video.pause(); }
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('error', sync);
  preference.addEventListener('change', () => {
    if (preference.matches) video.pause();
    else if (!userPaused) void play();
  });
  if (!preference.matches) void play();
  sync();
});
