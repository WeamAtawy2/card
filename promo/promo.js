const promo = document.querySelector('#promo');
const petalBed = document.querySelector('#petal-bed');
const beatDuration = 60 / 112;
const scenes = [...document.querySelectorAll('.scene')];

scenes.forEach((scene) => {
  const delay = Number(scene.dataset.startBeat) * beatDuration;
  const duration = Number(scene.dataset.durationBeats) * beatDuration;
  scene.style.setProperty('--delay', `${delay.toFixed(4)}s`);
  scene.style.setProperty('--duration', `${duration.toFixed(4)}s`);
});

for (let index = 0; index < 25; index += 1) {
  const particle = document.createElement('i');
  const isPetal = index < 17;
  particle.className = isPetal ? 'petal' : 'gold-dust';
  particle.style.setProperty('--x', `${(index * 43 + 7) % 100}%`);
  particle.style.setProperty('--y', `${(index * 31 + 11) % 88}%`);
  particle.style.setProperty('--size', `${10 + (index % 4) * 3}px`);
  particle.style.setProperty('--duration', `${10 + (index % 5) * 2.4}s`);
  particle.style.setProperty('--delay', `${-((index * 2.7) % 17)}s`);
  particle.style.setProperty('--drift', `${(index % 2 ? 1 : -1) * (35 + (index % 3) * 23)}px`);
  particle.style.setProperty('--spin', `${(index % 2 ? 1 : -1) * (145 + index * 19)}deg`);
  petalBed.append(particle);
}

document.querySelectorAll('.memory-photo img').forEach((image) => {
  image.addEventListener('error', () => image.closest('.memory-photo').style.background = '#d8c8b8', { once: true });
});

window.startPromo = () => promo.classList.add('is-live');
window.promoDuration = 44 * beatDuration;
if (new URLSearchParams(window.location.search).has('render')) window.startPromo();
