document.addEventListener('DOMContentLoaded', () => {
  const testBtn = document.querySelector('.test-button');
const resultEl = document.getElementById('testResult');

const correctAnswers = ['1', '4', '2', '3'];

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
    resultEl.textContent = 'Oops Please answer all questions';
    resultEl.classList.add('error');
  } else if (score === correctAnswers.length) {
    resultEl.textContent = 'Congratulation!';
    resultEl.classList.add('success');
  } else {
    resultEl.textContent = 'Oops';
    resultEl.classList.add('error');
  }

  resultEl.classList.add('show');
});
  });