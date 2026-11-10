document.addEventListener('DOMContentLoaded', () => {
  const testBtn = document.querySelector('.test-button');
  const resultEl = document.getElementById('testResult');
  const answerKey = document.getElementById('sound-answers');
  const cards = [...document.querySelectorAll('.sound-card')];

  if (!testBtn || !resultEl || !answerKey || !cards.length) return;

  // Keep scoring and the visible answer key in sync, even if cards are reordered.
  const correctAnswers = new Map(
    [...answerKey.querySelectorAll('[data-answer-for]')].map(answer =>
      [answer.dataset.answerFor, answer.dataset.correctAnswer]),
  );

  document.querySelector('.sound-answers-link')?.addEventListener('click', () => {
    answerKey.open = true;
  });

  testBtn.addEventListener('click', () => {
    let score = 0;
    const unanswered = [];

    cards.forEach(card => {
      const checked = card.querySelector('input[type="radio"]:checked');

      if (!checked) {
        unanswered.push(card.querySelector('.sound-player__title').textContent.trim());
        return;
      }

      if (checked.value === correctAnswers.get(checked.name)) {
        score += 1;
      }
    });

    resultEl.classList.remove('success', 'error', 'show');

    if (unanswered.length) {
      resultEl.textContent = `Please choose an answer for ${unanswered.join(', ')} before checking your results.`;
      resultEl.classList.add('error');
    } else if (score === cards.length) {
      resultEl.textContent = 'Got it! You must be an expert! The answers are shown below.';
      resultEl.classList.add('success');
    } else {
      resultEl.textContent = `You identified ${score} of ${cards.length} sounds correctly. Read the answers below and try again!`;
      resultEl.classList.add('error');
    }

    if (!unanswered.length) answerKey.open = true;
    resultEl.classList.add('show');
    resultEl.focus();
  });
});
