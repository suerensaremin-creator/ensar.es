// Elemanlar
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

const qText = document.getElementById("qText");
const qImage = document.getElementById("qImage");
const optA = document.getElementById("optA");
const optAImg = document.getElementById("optAImg");
const optB = document.getElementById("optB");
const optBImg = document.getElementById("optBImg");
const optC = document.getElementById("optC");
const optCImg = document.getElementById("optCImg");
const optD = document.getElementById("optD");
const optDImg = document.getElementById("optDImg");
const correctIndexSel = document.getElementById("correctIndex");
const editingIndex = document.getElementById("editingIndex");
const saveQuestionBtn = document.getElementById("saveQuestion");
const newQuestionBtn = document.getElementById("newQuestion");
const deleteQuestionBtn = document.getElementById("deleteQuestion");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

// Durum
let questions = loadQuestions() || defaultQuestions();
let currentIndex = 0;
let timeLeft = 30;
let roundTimerId = null;
let roundResolved = false; // "önce basan" kontrolü
let penaltyLeftActive = false;
let penaltyRightActive = false;
let leftScore = 0;
let rightScore = 0;

// Başlat
renderQuestionList();
buildOptionButtons();
updateScores();

// Oyun başlat
startBtn.addEventListener("click", () => {
  startBtn.classList.add("hidden");
  gameArea.classList.remove("hidden");
  roundTimer.classList.remove("hidden");
  currentIndex = 0;
  leftScore = 0; rightScore = 0;
  updateScores();
  showQuestion(currentIndex);
  startRoundTimer();
});

// Soru yönetimi aç
questionManagerBtn.addEventListener("click", () => {
  qmOverlay.classList.remove("hidden");
  renderQuestionList();
});

// Soru yönetimi kapat: buton, ESC ve arka plana tıklama
closeQm.addEventListener("click", closeQmOverlay);
qmOverlay.addEventListener("click", (e)=>{
  if(e.target === qmOverlay){ // arka plan
    closeQmOverlay();
  }
});
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape" && !qmOverlay.classList.contains("hidden")){
    closeQmOverlay();
  }
});
function closeQmOverlay(){
  qmOverlay.classList.add("hidden");
}

// Yeni soru formu
newQuestionBtn.addEventListener("click", () => {
  editingIndex.value = -1;
  qText.value = "";
  qImage.value = "";
  optA.value = ""; optAImg.value = "";
  optB.value = ""; optBImg.value = "";
  optC.value = ""; optCImg.value = "";
  optD.value = ""; optDImg.value = "";
  correctIndexSel.value = "0";
});

// Sil
deleteQuestionBtn.addEventListener("click", () => {
  const idx = parseInt(editingIndex.value, 10);
  if (idx >= 0 && idx < questions.length) {
    questions.splice(idx, 1);
    saveQuestions(questions);
    renderQuestionList();
    newQuestionBtn.click();
  }
});

// Kaydet
document.getElementById("qmForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = {
    question: qText.value.trim(),
    questionImage: qImage.value.trim() || "",
    options: [
      { text: optA.value.trim(), image: optAImg.value.trim() || "" },
      { text: optB.value.trim(), image: optBImg.value.trim() || "" },
      { text: optC.value.trim(), image: optCImg.value.trim() || "" },
      { text: optD.value.trim(), image: optDImg.value.trim() || "" },
    ],
    answer: parseInt(correctIndexSel.value, 10)
  };
  const idx = parseInt(editingIndex.value, 10);
  if (idx >= 0 && idx < questions.length) {
    questions[idx] = item;
  } else {
    questions.push(item);
  }
  saveQuestions(questions);
  renderQuestionList();
  alert("Soru kaydedildi.");
});

// Dışa aktar / İçe aktar
exportBtn.addEventListener("click", ()=>{
  const data = JSON.stringify(questions, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kureys_sorular.json";
  a.click();
  URL.revokeObjectURL(url);
});
importFile.addEventListener("change", async ()=>{
  const file = importFile.files[0];
  if(!file) return;
  const text = await file.text();
  try{
    const arr = JSON.parse(text);
    if(Array.isArray(arr)){
      questions = arr;
      saveQuestions(questions);
      renderQuestionList();
      alert("Sorular içe aktarıldı.");
    } else {
      alert("Geçersiz dosya formatı.");
    }
  } catch(e){
    alert("JSON okunamadı.");
  }
});

// Liste render ve düzenleme seçimi
function renderQuestionList(){
  questionList.innerHTML = "";
  questions.forEach((q, i) => {
    const li = document.createElement("li");
    const text = q.question.length > 80 ? q.question.slice(0,80)+"..." : q.question;
    li.innerHTML = `
      <div>
        <div><strong>${i+1}.</strong> ${escapeHtml(text)}</div>
        <div class="meta">Doğru: ${["A","B","C","D"][q.answer]}</div>
      </div>
      <div>
        <button data-edit="${i}" class="primary">Düzenle</button>
      </div>
    `;
    questionList.appendChild(li);
  });

  questionList.querySelectorAll("button[data-edit]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = parseInt(btn.dataset.edit,10);
      const q = questions[i];
      editingIndex.value = i;
      qText.value = q.question || "";
      qImage.value = q.questionImage || "";
      optA.value = q.options[0]?.text || ""; optAImg.value = q.options[0]?.image || "";
      optB.value = q.options[1]?.text || ""; optBImg.value = q.options[1]?.image || "";
      optC.value = q.options[2]?.text || ""; optCImg.value = q.options[2]?.image || "";
      optD.value = q.options[3]?.text || ""; optDImg.value = q.options[3]?.image || "";
      correctIndexSel.value = String(q.answer ?? 0);
    });
  });
}

// Şık butonlarını iki tarafa kur (A,B,C,D; aynı içerik)
function buildOptionButtons(){
  leftOptionsBox.innerHTML = "";
  rightOptionsBox.innerHTML = "";
  ["A","B","C","D"].forEach((label, idx)=>{
    const leftBtn = createOptionButton("left", label, idx);
    const rightBtn = createOptionButton("right", label, idx);
    leftOptionsBox.appendChild(leftBtn);
    rightOptionsBox.appendChild(rightBtn);
  });
}

// Şık butonu oluştur
function createOptionButton(team, label, index){
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

// Soru göster
function showQuestion(i){
  roundResolved = false;
  document.querySelectorAll(".optionBtn").forEach(btn=>{
    btn.classList.remove("disabled","faded");
  });
  leftRightWrong.classList.remove("show");
  rightRightWrong.classList.remove("show");

  const q = questions[i];
  questionText.textContent = q.question || "";
  if(q.questionImage){
    questionImage.src = q.questionImage;
    questionImage.classList.remove("hidden");
  } else {
    questionImage.classList.add("hidden");
    questionImage.removeAttribute("src");
  }

  // Şık içerikleri (iki taraf aynı)
  document.querySelectorAll(".optionBtn").forEach(btn=>{
    const idx = parseInt(btn.dataset.index,10);
    const opt = q.options[idx] || {text:"", image:""};
    const textEl = btn.querySelector(".text");
    const imgEl = btn.querySelector(".optImage");
    textEl.textContent = opt.text || "";
    if(opt.image){
      imgEl.src = opt.image;
      imgEl.classList.remove("hidden");
    } else {
      imgEl.classList.add("hidden");
      imgEl.removeAttribute("src");
    }
  });
}

// Tur sayacı
function startRoundTimer(){
  clearInterval(roundTimerId);
  timeLeft = 30;
  roundTimeEl.textContent = timeLeft;
  roundTimerId = setInterval(()=>{
    timeLeft--;
    roundTimeEl.textContent = timeLeft;
    if(timeLeft <= 0){
      clearInterval(roundTimerId);
      nextQuestion(); // puan değişmeden
    }
  },1000);
}

// Şık tıklama mantığı
function onOptionClick(e){
  const btn = e.currentTarget;
  const team = btn.dataset.team; // "left" veya "right"
  const idx = parseInt(btn.dataset.index,10);

  // Ceza aktifse o takım cevap veremez
  if(team === "left" && penaltyLeftActive) return;
  if(team === "right" && penaltyRightActive) return;

  const q = questions[currentIndex];
  const isCorrect = idx === q.answer;

  if(!isCorrect){
    // Yanlış: sadece o takım 3 sn ceza ve o tarafta seçilen şık soluklaşır
    startPenalty(team);
    fadeOption(team, idx);
    return;
  }

  // Doğru: "önce basan" 5 puan
  if(!roundResolved){
    roundResolved = true;
    clearInterval(roundTimerId);

    if(team === "left"){
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

    // Her iki tarafta doğru işareti kısa görünür
    showRightMark("left");
    showRightMark("right");

    disableAllOptions();
    setTimeout(nextQuestion, 1400);
  }
}

// Ceza başlat (3 sn)
function startPenalty(team){
  const penaltyTime = 3;
  if(team === "left"){
    if(penaltyLeftActive) return;
    penaltyLeftActive = true;
    countdownPenalty(leftPenaltyEl, penaltyTime, ()=>{ penaltyLeftActive=false; });
  } else {
    if(penaltyRightActive) return;
    penaltyRightActive = true;
    countdownPenalty(rightPenaltyEl, penaltyTime, ()=>{ penaltyRightActive=false; });
  }
}
function countdownPenalty(el, seconds, onDone){
  let t = seconds;
  el.textContent = t;
  el.classList.remove("hidden");
  const id = setInterval(()=>{
    t--;
    el.textContent = t;
    if(t<=0){
      clearInterval(id);
      el.classList.add("hidden");
      onDone && onDone();
    }
  },1000);
}

// Yanlış seçilen şıkkı o taraf için soluklaştır
function fadeOption(team, idx){
  const container = team === "left" ? leftOptionsBox : rightOptionsBox;
  const btn = Array.from(container.querySelectorAll(".optionBtn")).find(b=>parseInt(b.dataset.index,10)===idx);
  if(btn){ btn.classList.add("faded"); }
}

// Doğru işareti
function showRightMark(team){
  const box = team === "left" ? leftRightWrong : rightRightWrong;
  box.textContent = "Doğru ✔";
  box.classList.add("show");
  setTimeout(()=> box.classList.remove("show"), 1200);
}

// Tüm şıkları kapat
function disableAllOptions(){
  document.querySelectorAll(".optionBtn").forEach(btn=> btn.classList.add("disabled"));
}

// Sonraki soru veya oyun sonu
function nextQuestion(){
  currentIndex++;
  if(currentIndex < questions.length){
    showQuestion(currentIndex);
    startRoundTimer();
  } else {
    endGame();
  }
}

// Oyun sonu
function endGame(){
  gameArea.classList.add("hidden");
  roundTimer.classList.add("hidden");
  endOverlay.classList.remove("hidden");
  if(leftScore > rightScore){
    endResult.textContent = "Kazanan: A Takımı";
  } else if(rightScore > leftScore){
    endResult.textContent = "Kazanan: B Takımı";
  } else {
    endResult.textContent = "BERABERE";
  }
}
restartBtn.addEventListener("click", ()=>{
  endOverlay.classList.add("hidden");
  startBtn.classList.remove("hidden");
});

// Skor güncelle
function updateScores(){
  leftScoreEl.textContent = leftScore;
  rightScoreEl.textContent = rightScore;
}

// Basit konfeti (tek taraf)
const confettiCanvas = document.getElementById("confettiCanvas");
const ctx = confettiCanvas.getContext("2d");
let confettiItems = [];
function fireConfetti(side){
  confettiCanvas.classList.remove("hidden");
  resizeCanvas();
  const isLeft = side === "left";
  const originX = isLeft ? window.innerWidth * 0.25 : window.innerWidth * 0.75;
  const originY = window.innerHeight * 0.25;

  // Takım rengi
  const color = isLeft ? "#ff3b3b" : "#2f7cff";
  for(let i=0;i<100;i++){
    confettiItems.push({
      x: originX + (Math.random()-0.5)*140,
      y: originY + (Math.random()-0.5)*90,
      vx: (Math.random()-0.5)*4.5,
      vy: Math.random()*3.2+2,
      size: Math.random()*6+3,
      color,
      life: Math.random()*60+40
    });
  }
  animateConfetti();
  setTimeout(()=>{
    confettiCanvas.classList.add("hidden");
    confettiItems = [];
  }, 1300);
}
function resizeCanvas(){
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", ()=>{
  if(!confettiCanvas.classList.contains("hidden")) resizeCanvas();
});
function animateConfetti(){
  ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confettiItems.forEach(p=>{
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life--;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  confettiItems = confettiItems.filter(p=>p.life>0 && p.y < window.innerHeight+20);
  if(confettiItems.length>0){
    requestAnimationFrame(animateConfetti);
  }
}

// Varsayılan sorular
function defaultQuestions(){
  return [
    {
      question: "Türkiye'nin başkenti neresidir?",
      questionImage: "",
      options: [
        {text:"İstanbul", image:""},
        {text:"Ankara", image:""},
        {text:"İzmir", image:""},
        {text:"Bursa", image:""}
      ],
      answer: 1
    },
    {
      question: "En büyük gezegen hangisidir?",
      questionImage: "",
      options: [
        {text:"Mars", image:""},
        {text:"Venüs", image:""},
        {text:"Jüpiter", image:""},
        {text:"Dünya", image:""}
      ],
      answer: 2
    }
  ];
}

// LocalStorage
function saveQuestions(qs){
  localStorage.setItem("kureys_questions", JSON.stringify(qs));
}
function loadQuestions(){
  try{
    const raw = localStorage.getItem("kureys_questions");
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

// Yardımcı
function escapeHtml(s){
  return s.replace(/[&<>"']/g, m=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
}
