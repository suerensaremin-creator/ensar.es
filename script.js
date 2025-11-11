const qmForm = document.getElementById("qmForm");
const questionList = document.getElementById("questionList");
const qText = document.getElementById("qText");
const qImage = document.getElementById("qImage");
const qImageFile = document.getElementById("qImageFile"); // yeni
const optA = document.getElementById("optA");
const optAImg = document.getElementById("optAImg");
const optAImgFile = document.getElementById("optAImgFile"); // yeni
const optB = document.getElementById("optB");
const optBImg = document.getElementById("optBImg");
const optBImgFile = document.getElementById("optBImgFile"); // yeni
const optC = document.getElementById("optC");
const optCImg = document.getElementById("optCImg");
const optCImgFile = document.getElementById("optCImgFile"); // yeni
const optD = document.getElementById("optD");
const optDImg = document.getElementById("optDImg");
const optDImgFile = document.getElementById("optDImgFile"); // yeni
const correctIndex = document.getElementById("correctIndex");
const editingIndex = document.getElementById("editingIndex");

let questions = JSON.parse(localStorage.getItem("questions")) || [];
renderQuestions();

function renderQuestions() {
  questionList.innerHTML = "";
  questions.forEach((q, i) => {
    const li = document.createElement("li");
    li.textContent = q.text.slice(0, 50) + (q.text.length > 50 ? "..." : "");
    li.onclick = () => loadQuestion(i);
    questionList.appendChild(li);
  });
}

function loadQuestion(i) {
  const q = questions[i];
  qText.value = q.text;
  qImage.value = q.image || "";
  optA.value = q.options[0].text;
  optB.value = q.options[1].text;
  optC.value = q.options[2].text;
  optD.value = q.options[3].text;
  optAImg.value = q.options[0].image || "";
  optBImg.value = q.options[1].image || "";
  optCImg.value = q.options[2].image || "";
  optDImg.value = q.options[3].image || "";
  correctIndex.value = q.correct;
  editingIndex.value = i;
}

function readImageFile(file, callback) {
  if (!file) return callback(null);
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result);
  reader.readAsDataURL(file);
}

qmForm.addEventListener("submit", e => {
  e.preventDefault();

  // Soru görseli önce dosyadan okunur, yoksa URL kullanılır
  readImageFile(qImageFile.files[0], imgData => {
    const questionData = {
      text: qText.value,
      image: imgData || qImage.value || null,
      options: [],
      correct: parseInt(correctIndex.value)
    };

    const optInputs = [
      { text: optA.value, url: optAImg.value, file: optAImgFile.files[0] },
      { text: optB.value, url: optBImg.value, file: optBImgFile.files[0] },
      { text: optC.value, url: optCImg.value, file: optCImgFile.files[0] },
      { text: optD.value, url: optDImg.value, file: optDImgFile.files[0] }
    ];

    let done = 0;
    optInputs.forEach((opt, i) => {
      readImageFile(opt.file, imgOptData => {
        questionData.options[i] = {
          text: opt.text,
          image: imgOptData || opt.url || null
        };
        done++;
        if (done === 4) {
          saveQuestion(questionData);
        }
      });
    });
  });
});

function saveQuestion(qData) {
  const idx = parseInt(editingIndex.value);
  if (idx === -1) questions.push(qData);
  else questions[idx] = qData;
  localStorage.setItem("questions", JSON.stringify(questions));
  renderQuestions();
  qmForm.reset();
  editingIndex.value = -1;
}

document.getElementById("newQuestion").onclick = () => {
  qmForm.reset();
  editingIndex.value = -1;
};

document.getElementById("deleteQuestion").onclick = () => {
  const idx = parseInt(editingIndex.value);
  if (idx === -1) return alert("Silmek için bir soru seçin!");
  questions.splice(idx, 1);
  localStorage.setItem("questions", JSON.stringify(questions));
  renderQuestions();
  qmForm.reset();
  editingIndex.value = -1;
};

// Dışa / içe aktar
document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sorular.json";
  a.click();
};

document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    questions = JSON.parse(ev.target.result);
    localStorage.setItem("questions", JSON.stringify(questions));
    renderQuestions();
  };
  reader.readAsText(file);
});


