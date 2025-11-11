// ---------------------------
// script.js (tam, düzeltilmiş)
// ---------------------------

// === Güvenli storage sarmalayıcıları ===
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage getItem engellendi:", e);
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage setItem engellendi:", e);
  }
}

// === Elemanlar (null-checked) ===
const startBtn = document.getElementById("startBtn");
const questionManagerBtn = document.getElementById("questionManagerBtn");
const gameArea = document.getElementById("gameArea");
const roundTimer = document.getElementById("roundTimer");
const roundTimeEl = document.getElementById("roundTime");

const questionText = document.getElementById("questionText");
const questionImage = document.getElementById("questionImage");

const leftScoreEl = document.getElementById("leftScore");
const rightScoreEl = document.getElementById("rightScore");
const leftPenaltyEl = document.getElementById("leftPenalty");
const rightPenaltyEl = document.getElementById("rightPenalty");
const leftRightWrong = document.getElementById("leftRightWrong");
const rightRightWrong = document.getElementById("rightRightWrong");

const leftOptionsBox = document.getElementById("leftOptions");
const rightOptionsBox = document.getElementById("rightOptions");

const endOverlay = document.getElementById("endOverlay");
const endResult = document.getElementById("endResult");
const restartBtn = document.getElementById("restartBtn");

const qmOverlay = document.getElementById("qmOverlay");
const closeQm = document.getElementById("closeQm");
const questionList = document.getElementById("questionList");

// QM form elements (some may be null depending on your HTML edits)
const qmForm = document.getElementById("qmForm");
const qText = document.getElementById("qText");
const qImage = document.getElementById("qImage"); // legacy URL field (may be present)
const qImageFile = document.getElementById("qImageFile"); // file input (optional)
const qImagePreview = document.getElementById("qImagePreview"); // optional preview img

const optA = document.getElementById("optA");
const optAImg = document.getElementById("optAImg");
const optAImgFile = document.getElementById("optAImgFile"); // optional
const optB = document.getElementById("optB");
const optBImg = document.getElementById("optBImg");
const optBImgFile = document.getElementById("optBImgFile"); // optional
const optC = document.getElementById("optC");
const optCImg = document.getElementById("optCImg");
const optCImgFile = document.getElementById("optCImgFile"); // optional
const optD = document.getElementById("optD");
const optDImg = document.getElementById("optDImg");
const optDImgFile = document.getElementById("optDImgFile"); // optional

const correctIndexSel = document.getElementById("correctIndex");
const editingIndex = document.getElementById("editingIndex");
const saveQuestionBtn = document.getElementById("saveQuestion");
const newQuestionBtn = document.getElementById("newQuestion");
const deleteQuestionBtn = document.getElementById("deleteQuestion");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

// Konfeti canvas
const confettiCanvas = document.getElementById("confettiCanvas");
const ctx = confettiCanvas ? confettiCanvas.getContext("2d") : null;

// === Durum ===
// try to load from storage; fallback to defaultQuestions if nothing or storage blocked
let questions = [];
function loadQuestionsFromStorage() {
  try {
    const raw = safeGetItem("kureys_questions");
    if (raw) return JSON.parse(raw);
    return null;
  } catch (e) {
    return null;
  }
}
questions = loadQuestionsFromStorage() || defaultQuestions();
let currentIndex = 0;
let timeLeft = 30;
let roundTimerId = null;
let roundResolved = false; // "önce basan" kontrolü
let penaltyLeftActive = false;
let penaltyRightActive = false;
let leftScore = 0;
let rightScore = 0;

// === Başlat (render / build) ===
renderQuestionList();
buildOptionButtons();
updateScores();

// --- Oyun başlat ---
if (startBtn) {
  startBtn.addEventListener("click", async () => {
    // try request storage access on user gesture (best-effort)
    if (typeof document.requestStorageAccess === "function") {
      try {
        if (!(await document.hasStorageAccess())) {
          await document.requestStorageAccess();
        }
      } catch (err) {
        // ignore — best-effort
      }
    }

    startBtn.classList.add("hidden");
    if (gameArea) gameArea.classList.remove("hidden");
    if (roundTimer) roundTimer.classList.remove("hidden");
    currentIndex = 0;
    leftScore = 0; rightScore = 0;
    updateScores();
    showQuestion(currentIndex);
    startRoundTimer();
  });
}

// --- Soru yönetimi aç ---
if (questionManagerBtn) {
  questionManagerBtn.addEventListener("click", () => {
    if (qmOverlay) qmOverlay.classList.remove("hidden");
    renderQuestionList();
  });
}

// --- Soru yönetimi kapat ---
if (closeQm) closeQm.addEventListener("click", closeQmOverlay);
if (qmOverlay) {
  qmOverlay.addEventListener("click", (e) => {
    if (e.target === qmOverlay) closeQmOverlay();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && qmOverlay && !qmOverlay.classList.contains("hidden")) {
    closeQmOverlay();
  }
});
function closeQmOverlay() {
  if (qmOverlay) qmOverlay.classList.add("hidden");
}

// --- Yeni soru butonu ---
if (newQuestionBtn) {
  newQuestionBtn.addEventListener("click", () => {
    if (editingIndex) editingIndex.value = -1;
    if (qText) qText.value = "";
    if (qImage) qImage.value = "";
    if (qImagePreview) { qImagePreview.style.display = 'none'; qImagePreview.src = ''; delete qImagePreview.dataset.base64; }
    if (optA) optA.value = ""; if (optAImg) optAImg.value = "";
    if (optB) optB.value = ""; if (optBImg) optBImg.value = "";
    if (optC) optC.value = ""; if (optCImg) optCImg.value = "";
    if (optD) optD.value = ""; if (optDImg) optDImg.value = "";
    if (correctIndexSel) correctIndexSel.value = "0";
  });
}

// --- Sil butonu ---
if (deleteQuestionBtn) {
  deleteQuestionBtn.addEventListener("click", () => {
    const idx = editingIndex ? parseInt(editingIndex.value, 10) : -1;
    if (idx >= 0 && idx < questions.length) {
      questions.splice(idx, 1);
      safeSetItem("kureys_questions", JSON.stringify(questions));
      renderQuestionList();
      if (newQuestionBtn) newQuestionBtn.click();
    }
  });
}

// === FileReader yardımcı (promise) ===
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// --- QM Form submit (async) ---
if (qmForm) {
  qmForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // read question image file first (if file input exists)
    let questionImageData = "";
    if (qImageFile && qImageFile.files && qImageFile.files[0]) {
      questionImageData = await fileToBase64(qImageFile.files[0]);
      // set preview dataset if exists
      if (qImagePreview) {
        qImagePreview.src = questionImageData;
        qImagePreview.dataset.base64 = questionImageData;
        qImagePreview.style.display = 'block';
      }
    } else if (qImage && qImage.value && qImage.value.trim() !== "") {
      questionImageData = qImage.value.trim();
    } else {
      questionImageData = "";
    }

    // read option images (if file inputs exist), otherwise use URL fields
    const optAdata = optAImgFile && optAImgFile.files && optAImgFile.files[0] ? await fileToBase64(optAImgFile.files[0]) : (optAImg && optAImg.value.trim() ? optAImg.value.trim() : "");
    const optBdata = optBImgFile && optBImgFile.files && optBImgFile.files[0] ? await fileToBase64(optBImgFile.files[0]) : (optBImg && optBImg.value.trim() ? optBImg.value.trim() : "");
    const optCdata = optCImgFile && optCImgFile.files && optCImgFile.files[0] ? await fileToBase64(optCImgFile.files[0]) : (optCImg && optCImg.value.trim() ? optCImg.value.trim() : "");
    const optDdata = optDImgFile && optDImgFile.files && optDImgFile.files[0] ? await fileToBase64(optDImgFile.files[0]) : (optDImg && optDImg.value.trim() ? optDImg.value.trim() : "");

    const item = {
      question: qText ? qText.value.trim() : "",
      questionImage: questionImageData || "",
      options: [
        { text: optA ? optA.value.trim() : "", image: optAdata || "" },
        { text: optB ? optB.value.trim() : "", image: optBdata || "" },
        { text: optC ? optC.value.trim() : "", image: optCdata || "" },
        { text: optD ? optD.value.trim() : "", image: optDdata || "" },
      ],
      answer: correctIndexSel ? parseInt(correctIndexSel.value, 10) : 0
    };

    const idx = editingIndex ? parseInt(editingIndex.value, 10) : -1;
    if (idx >= 0 && idx < questions.length) {
      questions[idx] = item;
    } else {
      questions.push(item);
    }

    safeSetItem("kureys_questions", JSON.stringify(questions));
    renderQuestionList();
    alert("Soru kaydedildi.");
    qmForm.reset();
    if (editingIndex) editingIndex.value = -1;
    if (qImagePreview) { qImagePreview.style.display = 'none'; qImagePreview.src = ''; delete qImagePreview.dataset.base64; }
  });
}

// --- Export / Import ---
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    try {
      const data = JSON.stringify(questions, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kureys_sorular.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Dışa aktarırken hata: " + e.message);
    }
  });
}
if (importFile) {
  importFile.addEventListener("change", async () => {
    const file = importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        questions = arr;
        safeSetItem("kureys_questions", JSON.stringify(questions));
        renderQuestionList();
        alert("Sorular içe aktarıldı.");
      } else {
        alert("Geçersiz dosya formatı.");
      }
    } catch (e) {
      alert("JSON okunamadı: " + e.message);
    }
  });
}

// === Liste render ve düzenleme seçimi ===
function renderQuestionList() {
  if (!questionList) return;
  questionList.innerHTML = "";
  questions.forEach((q, i) => {
    const li = document.createElement("li");
    const text = (q.question || q.question || "").length > 80 ? (q.question || "").slice(0, 80) + "..." : (q.question || "");
    li.innerHTML = `
      <div>
        <div><strong>${i + 1}.</strong> ${escapeHtml(text)}</div>
        <div class="meta">Doğru: ${["A","B","C","D"][q.answer]}</div>
      </div>
      <div>
        <button data-edit="${i}" class="primary">Düzenle</button>
      </div>
    `;
    questionList.appendChild(li);
  });

  // add event listeners to edit buttons
  questionList.querySelectorAll("button[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.edit, 10);
      const q = questions[i];
      if (!q) return;
      if (editingIndex) editingIndex.value = i;
      if (qText) qText.value = q.question || "";
      if (qImage) qImage.value = q.questionImage || "";
      if (optA) optA.value = q.options[0]?.text || ""; if (optAImg) optAImg.value = q.options[0]?.image || "";
      if (optB) optB.value = q.options[1]?.text || ""; if (optBImg) optBImg.value = q.options[1]?.image || "";
      if (optC) optC.value = q.options[2]?.text || ""; if (optCImg) optCImg.value = q.options[2]?.image || "";
      if (optD) optD.value = q.options[3]?.text || ""; if (optDImg) optDImg.value = q.options[3]?.image || "";
      if (correctIndexSel) correctIndexSel.value = String(q.answer ?? 0);

      // if preview exists and questionImage is base64, show preview
      if (qImagePreview && q.questionImage) {
        qImagePreview.src = q.questionImage;
        qImagePreview.style.display = 'block';
        qImagePreview.dataset.base64 = q.questionImage;
      } else if (qImagePreview) {
        qImagePreview.style.display = 'none';
        qImagePreview.src = '';
        delete qImagePreview.dataset.base64;
      }

      // open overlay if closed
      if (qmOverlay) qmOverlay.classList.remove("hidden");
    });
  });
}

// === Şık butonları ve oyun mantığı (aynı kod, null-safe) ===
function buildOptionButtons() {
  if (!leftOptionsBox || !rightOptionsBox) return;
  leftOptionsBox.innerHTML = "";
  rightOptionsBox.innerHTML = "";
  ["A","B","C","D"].forEach((label, idx) => {
    const leftBtn = createOptionButton("left", label, idx);
    const rightBtn = createOptionButton("right", label, idx);
    leftOptionsBox.appendChild(leftBtn);
    rightOptionsBox.appendChild(rightBtn);
  });
}

function createOptionButton(team, label, index) {
  const btn = document.createElement("button");
  btn.className = "optionBtn";
  btn.dataset.team = team;
  btn.dataset.index = String(index);
  btn.innerHTML = `
    <span class="badge">${label}</span>
    <div class="content">
      <img class="optImage hidden" alt="">
      <div class="text"></div>
    </div>
  `;
  btn.addEventListener("click", onOptionClick);
  return btn;
}

function showQuestion(i) {
  roundResolved = false;
  document.querySelectorAll(".optionBtn").forEach(btn => {
    btn.classList.remove("disabled", "faded");
  });
  if (leftRightWrong) leftRightWrong.classList.remove("show");
  if (rightRightWrong) rightRightWrong.classList.remove("show");

  const q = questions[i];
  if (!q) return;
  if (questionText) questionText.textContent = q.question || "";
  if (questionImage) {
    if (q.questionImage) {
      questionImage.src = q.questionImage;
      questionImage.classList.remove("hidden");
    } else {
      questionImage.classList.add("hidden");
      questionImage.removeAttribute("src");
    }
  }

  document.querySelectorAll(".optionBtn").forEach(btn => {
    const idx = parseInt(btn.dataset.index, 10);
    const opt = q.options[idx] || { text: "", image: "" };
    const textEl = btn.querySelector(".text");
    const imgEl = btn.querySelector(".optImage");
    if (textEl) textEl.textContent = opt.text || "";
    if (imgEl) {
      if (opt.image) {
        imgEl.src = opt.image;
        imgEl.classList.remove("hidden");
      } else {
        imgEl.classList.add("hidden");
        imgEl.removeAttribute("src");
      }
    }
  });
}

// === Sayaç ===
function startRoundTimer() {
  if (!roundTimeEl) return;
  clearInterval(roundTimerId);
  timeLeft = 30;
  roundTimeEl.textContent = timeLeft;
  roundTimerId = setInterval(() => {
    timeLeft--;
    roundTimeEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(roundTimerId);
      nextQuestion();
    }
  }, 1000);
}

// === Şık tıklama ===
function onOptionClick(e) {
  const btn = e.currentTarget;
  const team = btn.dataset.team;
  const idx = parseInt(btn.dataset.index, 10);
  if (team === "left" && penaltyLeftActive) return;
  if (team === "right" && penaltyRightActive) return;
  const q = questions[currentIndex];
  if (!q) return;
  const isCorrect = idx === q.answer;
  if (!isCorrect) {
    startPenalty(team);
    fadeOption(team, idx);
    return;
  }
  if (!roundResolved) {
    roundResolved = true;
    clearInterval(roundTimerId);
    if (team === "left") {
      leftScore += 5;
      updateScores();
      showRightMark("left");
      fireConfetti("left");
    } else {
      rightScore += 5;
      updateScores();
      showRightMark("right");
      fireConfetti("right");
    }
    // both sides show mark briefly
    showRightMark("left"); showRightMark("right");
    disableAllOptions();
    setTimeout(nextQuestion, 1400);
  }
}

// === Ceza ===
function startPenalty(team) {
  const penaltyTime = 3;
  if (team === "left") {
    if (penaltyLeftActive) return;
    penaltyLeftActive = true;
    countdownPenalty(leftPenaltyEl, penaltyTime, () => { penaltyLeftActive = false; });
  } else {
    if (penaltyRightActive) return;
    penaltyRightActive = true;
    countdownPenalty(rightPenaltyEl, penaltyTime, () => { penaltyRightActive = false; });
  }
}
function countdownPenalty(el, seconds, onDone) {
  if (!el) { setTimeout(onDone, seconds * 1000); return; }
  let t = seconds;
  el.textContent = t;
  el.classList.remove("hidden");
  const id = setInterval(() => {
    t--;
    el.textContent = t;
    if (t <= 0) {
      clearInterval(id);
      el.classList.add("hidden");
      onDone && onDone();
    }
  }, 1000);
}
function fadeOption(team, idx) {
  const container = team === "left" ? leftOptionsBox : rightOptionsBox;
  if (!container) return;
  const btn = Array.from(container.querySelectorAll(".optionBtn")).find(b => parseInt(b.dataset.index, 10) === idx);
  if (btn) btn.classList.add("faded");
}
function showRightMark(team) {
  const box = team === "left" ? leftRightWrong : rightRightWrong;
  if (!box) return;
  box.textContent = "Doğru ✔";
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 1200);
}
function disableAllOptions() {
  document.querySelectorAll(".optionBtn").forEach(btn => btn.classList.add("disabled"));
}

// === Sonraki soru / oyun sonu ===
function nextQuestion() {
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion(currentIndex);
    startRoundTimer();
  } else {
    endGame();
  }
}
function endGame() {
  if (gameArea) gameArea.classList.add("hidden");
  if (roundTimer) roundTimer.classList.add("hidden");
  if (endOverlay) endOverlay.classList.remove("hidden");
  if (!endResult) return;
  if (leftScore > rightScore) {
    endResult.textContent = "Kazanan: A Takımı";
  } else if (rightScore > leftScore) {
    endResult.textContent = "Kazanan: B Takımı";
  } else {
    endResult.textContent = "BERABERE";
  }
}
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    if (endOverlay) endOverlay.classList.add("hidden");
    if (startBtn) startBtn.classList.remove("hidden");
  });
}

// === Skor güncelle ===
function updateScores() {
  if (leftScoreEl) leftScoreEl.textContent = leftScore;
  if (rightScoreEl) rightScoreEl.textContent = rightScore;
}

// === Konfeti ===
let confettiItems = [];
function fireConfetti(side) {
  if (!confettiCanvas || !ctx) return;
  confettiCanvas.classList.remove("hidden");
  resizeCanvas();
  const isLeft = side === "left";
  const originX = isLeft ? window.innerWidth * 0.25 : window.innerWidth * 0.75;
  const originY = window.innerHeight * 0.25;
  const color = isLeft ? "#ff3b3b" : "#2f7cff";
  for (let i = 0; i < 100; i++) {
    confettiItems.push({
      x: originX + (Math.random() - 0.5) * 140,
      y: originY + (Math.random() - 0.5) * 90,
      vx: (Math.random() - 0.5) * 4.5,
      vy: Math.random() * 3.2 + 2,
      size: Math.random() * 6 + 3,
      color,
      life: Math.random() * 60 + 40
    });
  }
  animateConfetti();
  setTimeout(() => {
    if (confettiCanvas) confettiCanvas.classList.add("hidden");
    confettiItems = [];
  }, 1300);
}
function resizeCanvas() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", () => {
  if (confettiCanvas && !confettiCanvas.classList.contains("hidden")) resizeCanvas();
});
function animateConfetti() {
  if (!ctx) return;
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiItems.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life--;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  confettiItems = confettiItems.filter(p => p.life > 0 && p.y < window.innerHeight + 20);
  if (confettiItems.length > 0) requestAnimationFrame(animateConfetti);
}

// === Varsayılan sorular ===
function defaultQuestions() {
  return [
    {
      question: "Türkiye'nin başkenti neresidir?",
      questionImage: "",
      options: [
        { text: "İstanbul", image: "" },
        { text: "Ankara", image: "" },
        { text: "İzmir", image: "" },
        { text: "Bursa", image: "" }
      ],
      answer: 1
    },
    {
      question: "En büyük gezegen hangisidir?",
      questionImage: "",
      options: [
        { text: "Mars", image: "" },
        { text: "Venüs", image: "" },
        { text: "Jüpiter", image: "" },
        { text: "Dünya", image: "" }
      ],
      answer: 2
    }
  ];
}

// === Yardımcılar ===
function saveQuestionsToStorage(qs) {
  try {
    safeSetItem("kureys_questions", JSON.stringify(qs));
  } catch (e) {
    console.warn("Sorular kaydedilemedi:", e);
  }
}
function loadQuestions() {
  try {
    const raw = safeGetItem("kureys_questions");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
