const qmForm = document.getElementById("qmForm");
const questionList = document.getElementById("questionList");
const qText = document.getElementById("qText");
const qImageFile = document.getElementById("qImageFile");
const optA = document.getElementById("optA");
const optAImgFile = document.getElementById("optAImgFile");
const optB = document.getElementById("optB");
const optBImgFile = document.getElementById("optBImgFile");
const optC = document.getElementById("optC");
const optCImgFile = document.getElementById("optCImgFile");
const optD = document.getElementById("optD");
const optDImgFile = document.getElementById("optDImgFile");
const correctIndex = document.getElementById("correctIndex");
const editingIndex = document.getElementById("editingIndex");

let questions = JSON.parse(localStorage.getItem("questions")) || [];
renderQuestions();

function renderQuestions() {
  questionList.innerHTML = "";
  questions.forEach((q, i) => {
    const li = document.createElement("li");
    li.textContent = q.text.slice(0,50)+(q.text.length>50?"...":"");
    li.onclick = ()=>loadQuestion(i);
    questionList.appendChild(li);
  });
}

function loadQuestion(i){
  const q = questions[i];
  qText.value = q.text;
  correctIndex.value = q.correct;
  editingIndex.value = i;
}

function readImageFile(file, callback){
  if(!file) return callback(null);
  const reader = new FileReader();
  reader.onload = e=>callback(e.target.result);
  reader.readAsDataURL(file);
}

qmForm.addEventListener("submit", e=>{
  e.preventDefault();

  readImageFile(qImageFile.files[0], qImg=>{
    const questionData = {
      text:qText.value,
      options:[],
      correct:parseInt(correctIndex.value)
    };

    const opts = [
      {text:optA.value, file:optAImgFile.files[0]},
      {text:optB.value, file:optBImgFile.files[0]},
      {text:optC.value, file:optCImgFile.files[0]},
      {text:optD.value, file:optDImgFile.files[0]},
    ];

    let done=0;
    opts.forEach((o,i)=>{
      readImageFile(o.file, img=>{
        questionData.options[i] = {text:o.text, image:img};
        done++;
        if(done===4){
          const idx=parseInt(editingIndex.value);
          if(idx===-1) questions.push(questionData);
          else questions[idx]=questionData;
          localStorage.setItem("questions", JSON.stringify(questions));
          renderQuestions();
          qmForm.reset();
          editingIndex.value=-1;
        }
      });
    });
  });
});

document.getElementById("newQuestion").onclick=()=>{
  qmForm.reset();
  editingIndex.value=-1;
};

document.getElementById("deleteQuestion").onclick=()=>{
  const idx=parseInt(editingIndex.value);
  if(idx===-1) return alert("Silmek için bir soru seçin!");
  questions.splice(idx,1);
  localStorage.setItem("questions", JSON.stringify(questions));
  renderQuestions();
  qmForm.reset();
  editingIndex.value=-1;
};

document.getElementById("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(questions,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="sorular.json";
  a.click();
};

document.getElementById("importFile").addEventListener("change",e=>{
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    questions=JSON.parse(ev.target.result);
    localStorage.setItem("questions",JSON.stringify(questions));
    renderQuestions();
  };
  reader.readAsText(file);
});

// Başlat butonu
const startBtn=document.getElementById("startBtn");
const qmOverlay=document.getElementById("qmOverlay");
const gameArea=document.getElementById("gameArea");

startBtn.onclick=()=>{
  qmOverlay.classList.add("hidden");
  gameArea.classList.remove("hidden");
};

document.getElementById("questionManagerBtn").onclick=()=>{
  qmOverlay.classList.remove("hidden");
};

document.getElementById("closeQm").onclick=()=>{
  qmOverlay.classList.add("hidden");
};
