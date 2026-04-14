document.addEventListener('DOMContentLoaded', () => {
  const testBtn = document.querySelector('.test-button');
  const resultEl = document.getElementById('testResult');

  const correctAnswers = ['1', '4', '2', '3'];

  if (!testBtn) return;
  testBtn.addEventListener('click', () => {
    const cards = document.querySelectorAll('.sound-card');

    let score = 0;
    let allAnswered = true;

    cards.forEach((card, index) => {
      const checked = card.querySelector('input[type="radio"]:checked');

      if (!checked) {
        allAnswered = false;
        return;
      }

      if (checked.value === correctAnswers[index]) {
        score += 1;
      }
    });

    resultEl.classList.remove('success', 'error', 'show');

    if (!allAnswered) {
      resultEl.textContent = 'OOPS, YOU LOSE ;(\nBut dont worry, its ok. V2M is here to help you!';
      resultEl.classList.add('error');
    } else if (score === correctAnswers.length) {
      resultEl.textContent = 'Got it! You must be an expert!';
      resultEl.classList.add('success');
    } else {
      resultEl.textContent = 'Oops';
      resultEl.classList.add('error');
    }

    resultEl.classList.add('show');
  });
});