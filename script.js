(function(){
"use strict";

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= STORY ENGINE ================= */
const viewport = document.getElementById('storyViewport');
const chapters = Array.from(document.querySelectorAll('.chapter'));
const progressBar = document.getElementById('storyProgress');
const tapLeft = document.getElementById('tapLeft');
const tapRight = document.getElementById('tapRight');
const N = chapters.length;
let current = 0;
let vw = window.innerWidth;

// build progress segments
chapters.forEach((ch, i) => {
  const seg = document.createElement('div');
  seg.className = 'progress-seg';
  seg.innerHTML = '<span class="fill"></span>';
  seg.title = ch.dataset.title || ('Chapter ' + (i+1));
  seg.addEventListener('click', () => goTo(i));
  progressBar.appendChild(seg);
});
const segs = Array.from(progressBar.children);

function updateProgress(){
  segs.forEach((s,i)=>{
    s.classList.toggle('done', i < current);
    s.classList.toggle('current', i === current);
  });
}

function render(instant){
  viewport.style.transition = instant ? 'none' : 'transform .5s ' + (reduceMotion ? 'linear' : 'cubic-bezier(.2,.7,.3,1)');
  viewport.style.transform = `translateX(${-current * vw}px)`;
  updateProgress();
}

function goTo(i){
  current = Math.max(0, Math.min(N - 1, i));
  render(false);
}
function next(){ if(current < N - 1) goTo(current + 1); }
function prev(){ if(current > 0) goTo(current - 1); }

tapLeft.addEventListener('click', prev);
tapRight.addEventListener('click', next);

window.addEventListener('resize', () => { vw = window.innerWidth; render(true); });

document.addEventListener('keydown', (e) => {
  if(document.getElementById('artifactModal').classList.contains('open')) return;
  if(e.key === 'ArrowRight') next();
  if(e.key === 'ArrowLeft') prev();
});

/* ---- drag / swipe navigation on the story itself ---- */
let dragActive = false, dragStartX = 0, dragStartY = 0, dragDX = 0, dragging2D = false;
const NAV_THRESHOLD = 70;

function withinExcludedZone(target){
  return target.closest('.filmstrip-wrap') || target.closest('.polaroid-deck') ||
         target.closest('.modal') || target.closest('a') || target.closest('button') ||
         target.closest('.progress-seg');
}

function dragStart(x, y, target){
  if(withinExcludedZone(target)) return;
  dragActive = true;
  dragging2D = false;
  dragStartX = x;
  dragStartY = y;
  dragDX = 0;
  viewport.style.transition = 'none';
}
function dragMove(x, y){
  if(!dragActive) return;
  const dx = x - dragStartX;
  const dy = y - dragStartY;
  if(!dragging2D && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
  dragging2D = true;
  if(Math.abs(dx) < Math.abs(dy)) return; // vertical gesture -> let native scroll happen
  dragDX = dx;
  let resisted = dragDX;
  if((current === 0 && dragDX > 0) || (current === N-1 && dragDX < 0)) resisted = dragDX * 0.3;
  viewport.style.transform = `translateX(${-current * vw + resisted}px)`;
}
function dragEnd(){
  if(!dragActive) return;
  dragActive = false;
  if(Math.abs(dragDX) > NAV_THRESHOLD){
    if(dragDX < 0) next(); else prev();
  } else {
    render(false);
  }
  dragDX = 0;
}

viewport.addEventListener('pointerdown', (e) => dragStart(e.clientX, e.clientY, e.target));
viewport.addEventListener('pointermove', (e) => dragMove(e.clientX, e.clientY));
window.addEventListener('pointerup', dragEnd);
window.addEventListener('pointercancel', dragEnd);

render(true);

/* ================= FILMSTRIP DRAG-TO-SCROLL ================= */
const filmWrap = document.getElementById('filmstripWrap');
if(filmWrap){
  let isDown = false, startX, scrollLeft;
  filmWrap.addEventListener('pointerdown', (e) => {
    isDown = true;
    filmWrap.classList.add('dragging');
    startX = e.clientX;
    scrollLeft = filmWrap.scrollLeft;
    filmWrap.setPointerCapture(e.pointerId);
  });
  filmWrap.addEventListener('pointermove', (e) => {
    if(!isDown) return;
    const dx = e.clientX - startX;
    filmWrap.scrollLeft = scrollLeft - dx;
  });
  const stopFilmDrag = () => { isDown = false; filmWrap.classList.remove('dragging'); };
  filmWrap.addEventListener('pointerup', stopFilmDrag);
  filmWrap.addEventListener('pointerleave', stopFilmDrag);
}

/* ================= ARTIFACT DATA ================= */
const artifactContent = {
  sql: {
    tag: "Artifact A",
    title: "sql transformation pipeline",
    images: ["sql-case-logic.png","sql-union-logic.png"],
    summary: "Two pieces of logic under every dashboard downstream: a CASE-based classification block mapping raw source codes into readable business categories and department groups, and a UNION-based consolidation block merging records from multiple regional/system sources into one clean base table, filtered to the correct reporting window.",
    contribution: "I wrote and tested this logic myself, iterating on the classification rules until every source code mapped to a defined category rather than falling into \"unassigned\", and structuring the UNION so new source tables can be added without rewriting the whole query.",
    usage: "The single source of truth every dashboard in this portfolio queries from.",
    skills: ["SQL / DML", "Data Classification", "Multi-source Consolidation", "Data Modelling"]
  },
  people: {
    tag: "Artifact B",
    title: "people overview dashboard",
    images: ["dash-people-overview.png"],
    summary: "Tracks staff availability, work patterns, and overtime trends on a rolling 7-day view, with a detailed work-pattern table underneath.",
    contribution: "Gathered requirements from the operations lead on what \"at-risk\" staffing looked like, built the CSV mockup, then implemented the SQL feeding availability, overtime, and odd-hour trend metrics.",
    usage: "Used by team leads to spot staffing risk early, before it becomes an SLA problem.",
    skills: ["Requirements Gathering", "BI Dashboard Design", "SQL", "Data Visualization"]
  },
  monitoring: {
    tag: "Artifact C",
    title: "monitoring overview dashboard",
    images: ["dash-monitoring-overview.png"],
    summary: "A live operational view of case load by channel, open cases by owner, and SLA/aging status by product.",
    contribution: "Built the SLA and aging summary logic (colour-banded by days remaining / overdue) and the product-level breakdown.",
    usage: "Checked multiple times a day by operations staff to triage cases before SLA breach.",
    skills: ["SQL", "Conditional Formatting Logic", "Stakeholder Communication"]
  },
  coreops: {
    tag: "Artifact D",
    title: "core ops processing: division head view",
    images: ["dash-core-ops-divhead.png"],
    summary: "A cross-region rollup (SG, MY, HK, MO, CN) of backlog, volume spikes, staff availability, and escalation indicators, filterable to department level.",
    contribution: "The one I'm proudest of. Owned it from the first requirements conversation through to production, and designed the escalation-indicator logic and department-level drill-down.",
    usage: "Reviewed by the Division Head and Heads of Department to compare load and risk across regions at a glance.",
    skills: ["Requirements Gathering", "Cross-region Data Consolidation", "SQL", "Executive BI Design"]
  },
  got: {
    tag: "Artifact E",
    title: "go&t technology version management",
    images: ["dash-got-version-mgmt.png"],
    summary: "Tracks access-compliance exceptions across systems, broken down by reporting line, with a detailed account-level breakdown.",
    contribution: "Implemented the SQL classifying each account against compliance status and rolling exception counts up by reporting line.",
    usage: "Used by technology leads to close out access-compliance gaps before audit.",
    skills: ["SQL", "Data Governance Awareness", "Compliance Reporting"]
  }
};
const deckOrder = ["got", "coreops", "monitoring", "people", "sql"]; // back to front

/* ================= POLAROID SWIPE DECK ================= */
const deckEl = document.getElementById('polaroidDeck');
const dotsEl = document.getElementById('deckDots');
let deckStack = deckOrder.slice();

function buildDots(){
  dotsEl.innerHTML = '';
  deckOrder.slice().reverse().forEach((key) => {
    const d = document.createElement('span');
    d.className = 'deck-dot';
    dotsEl.appendChild(d);
  });
}
function updateDots(){
  const front = deckStack[deckStack.length - 1];
  const orderFromFront = deckOrder.slice().reverse();
  Array.from(dotsEl.children).forEach((d, i) => {
    d.classList.toggle('active', orderFromFront[i] === front);
  });
}

function renderDeck(){
  deckEl.innerHTML = '';
  deckStack.forEach((key, i) => {
    const data = artifactContent[key];
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.dataset.key = key;
    const depth = deckStack.length - 1 - i;
    const rot = (depth === 0) ? 0 : (i % 2 === 0 ? -4 : 4);
    card.style.transform = `translateY(${depth*8}px) scale(${1 - depth*0.04}) rotate(${rot}deg)`;
    card.style.zIndex = i;
    card.innerHTML = `
      <span class="deck-flag mono">${data.tag}</span>
      <img src="${data.images[0]}" alt="${data.title}" draggable="false">
      <p class="deck-caption">${data.title}</p>
    `;
    deckEl.appendChild(card);
  });
  attachDeckDrag();
  updateDots();
}

function attachDeckDrag(){
  const topCard = deckEl.lastElementChild;
  if(!topCard) return;
  let down = false, sx = 0, sy = 0, dx = 0, moved = false;

  topCard.addEventListener('pointerdown', (e) => {
    down = true; moved = false;
    sx = e.clientX; sy = e.clientY; dx = 0;
    topCard.classList.add('dragging');
    topCard.setPointerCapture(e.pointerId);
  });
  topCard.addEventListener('pointermove', (e) => {
    if(!down) return;
    dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if(Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
    topCard.style.transform = `translateX(${dx}px) rotate(${dx/18}deg)`;
  });
  function release(){
    if(!down) return;
    down = false;
    topCard.classList.remove('dragging');
    if(Math.abs(dx) > 90){
      const dir = dx > 0 ? 1 : -1;
      topCard.style.transition = 'transform .4s ease, opacity .4s ease';
      topCard.style.transform = `translateX(${dir*600}px) rotate(${dir*30}deg)`;
      topCard.style.opacity = '0';
      setTimeout(() => {
        const moving = deckStack.pop();
        deckStack.unshift(moving);
        renderDeck();
      }, 220);
    } else if(!moved){
      openModal(topCard.dataset.key);
      topCard.style.transform = '';
    } else {
      topCard.style.transition = 'transform .3s ease';
      topCard.style.transform = '';
      setTimeout(() => { topCard.style.transition = ''; }, 300);
    }
  }
  topCard.addEventListener('pointerup', release);
  topCard.addEventListener('pointercancel', release);
}

buildDots();
renderDeck();

/* ================= CERTIFICATE WALL LIGHTBOX ================= */
const certsWall = document.getElementById('certsWall');
if(certsWall){
  certsWall.addEventListener('click', (e) => {
    const pin = e.target.closest('.cert-pin');
    if(!pin) return;
    const img = pin.querySelector('img');
    modalBody.innerHTML = `
      <span class="mono-tag">Certificate</span>
      <h3>${img.alt.toLowerCase()}</h3>
      <div class="modal-images single"><img src="${img.src}" alt="${img.alt}"></div>
    `;
    artifactModal.classList.add('open');
  });
}

/* ================= MODAL ================= */
const artifactModal = document.getElementById('artifactModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');

function openModal(key){
  const d = artifactContent[key];
  if(!d) return;
  modalBody.innerHTML = `
    <span class="mono-tag">${d.tag}</span>
    <h3>${d.title}</h3>
    <div class="modal-images">${d.images.map(src=>`<img src="${src}" alt="${d.title}">`).join('')}</div>
    <div class="modal-section"><h5>Summary</h5><p>${d.summary}</p></div>
    <div class="modal-section"><h5>My Contribution</h5><p>${d.contribution}</p></div>
    <div class="modal-section"><h5>How It's Used</h5><p>${d.usage}</p></div>
    <div class="modal-section"><h5>Skills Demonstrated</h5><div class="chip-row">${d.skills.map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>
  `;
  artifactModal.classList.add('open');
}
function closeModal(){ artifactModal.classList.remove('open'); }
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });

})();
