const qmForm = document.getElementById("qmForm");
const questionList = document.getElementById("questionList");
const qText = document.getElementById("qText");
const qImageFile = document.getElementById("qImageFile");
const qImagePreview = document.getElementById("qImagePreview");

const optA = document.getElementById("optA");
const optAImgFile = document.getElementById("optAImgFile");
const optAImgPreview = document.getElementById("optAImgPreview");

const optB = document.getElementById("optB");
const optBImgFile = document.getElementById("optBImgFile");
const optBImgPreview = document.getElementById("optBImgPreview");

const optC = document.getElementById("optC");
const optCImgFile = document.getElementById("optCImgFile");
const optCImgPreview = document.getElementById("optCImgPreview");

const optD = document.getElementById("optD");
const optDImgFile = document.getElementById("optDImgFile");
const optDImgPreview = document.getElementById("optDImgPreview");

const correctIndex = document.getElementById("correctIndex");
const editingIndex = document.getElementById("editingIndex");

let questions = JSON.parse(localStorage.getItem("questions")) || [];
renderQuestions();

function renderQuestions(){
  questionList.innerHTML = "";
  questions.forEach((q,i)=>{
    const li = document.createElement("li");
    li.textContent = q.text.slice(0,50) + (q.text.length>50?"...":"");
    li.onclick = ()=> loadQuestion(i);
    questionList.appendChild(li);
  });
}

function loadQuestion(i){
  const q = questions[i];
  qText.value = q.text;
  qImagePreview.src = q.image || "";
  qImagePreview.style.display = q.image?"block":"none";

  optA.value = q.options[0].text;
  optAImgPreview.src = q.options[0].image || "";
  optAImgPreview.style.display = q.options[0].image?"block":"none";

  optB.value = q.options[1].text;
  optBImgPreview.src = q.options[1].image || "";
  optBImgPreview.style.display = q.options[1].image?"block":"none";

  optC.value = q.options[2].text;
  optCImgPreview.src = q.options[2].image || "";
  optCImgPreview.style.display = q.options[2].image?"block":"none";

  optD.value = q.options[3].text;
  optDImgPreview.src = q.options[3].image || "";
  optDImgPreview.style.display = q.options[3].image?"block":"none";

  correctIndex.value = q.correct;
  editingIndex.value = i;
}

// dosyayı base64 olarak oku
function readFileBase64(file, callback){
  if(!file) return callback(null);
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result);
  reader.readAsDataURL(file);
}

// önizleme
[qImageFile,optAImgFile,optBImgFile,optCImgFile,optDImgFile].forEach((input,index)=>{
  const previewElems = [qImagePreview,optAImgPreview,optBImgPreview,optCImgPreview,optDImgPreview];
  input.addEventListener("change",()=>{
    const file = input.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = e=>{
        previewElems[index].src = e.target.result;
        previewElems[index].style.display = "block";
      }
      reader.readAsDataURL(file);
    }
  });
});

qmForm.addEventListener("submit", e=>{
  e.preventDefault();
  const optFiles = [optAImgFile,optBImgFile,optCImgFile,optDImgFile];
  const optTexts = [optA.value,optB.value,optC.value,optD.value];
  const optImagesPreview = [optAImgPreview,optBImgPreview,optCImgPreview,optDImgPreview];

  readFileBase64(qImageFile.files[0], qImgData=>{
    const questionData = {
      text: qText.value,
      image: qImgData || qImagePreview.src || null,
      options: [],
      correct: parseInt(correctIndex.value)
    };

    let done = 0;
    for(let i=0;i<4;i++){
      readFileBase64(optFiles[i].files[0], imgData=>{
        questionData.options[i] = { text: optTexts[i], image: imgData || optImagesPreview[i].src || null };
        done++;
        if(done===4) saveQuestion(questionData);
      });
    }
  });
});

function saveQuestion(qData){
  const idx = parseInt(editingIndex.value);
  if(idx===-1) questions.push(qData);
  else questions[idx] = qData;
  localStorage.setItem("questions", JSON.stringify(questions));
  renderQuestions();
  qmForm.reset();
  [qImagePreview,optAImgPreview,optBImgPreview,optCImgPreview,optDImgPreview].forEach(img=>{
    img.style.display="none"; img.src="";
  });
  editingIndex.value=-1;
}

document.getElementById("newQuestion").onclick = ()=>{
  qmForm.reset();
  [qImagePreview,optAImgPreview,optBImgPreview,optCImgPreview,optDImgPreview].forEach(img=>{
    img.style.display="none"; img.src="";
  });
  editingIndex.value=-1;
};

document.getElementById("deleteQuestion").onclick = ()=>{
  const idx = parseInt(editingIndex.value);
  if(idx===-1) return alert("Silmek için bir soru seçin!");
  questions.splice(idx,1);
  localStorage.setItem("questions",JSON.stringify(questions));
  renderQuestions();
  qmForm.reset();
  [qImagePreview,optAImgPreview,optBImgPreview,optCImgPreview,optDImgPreview].forEach(img=>{
    img.style.display="none"; img.src="";
  });
  editingIndex.value=-1;
};

// Dışa / içe aktar
document.getElementById("exportBtn").onclick = ()=>{
  const blob = new Blob([JSON.stringify(questions,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download="sorular.json";
  a.click();
};

document.getElementById("importFile").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    questions = JSON.parse(ev.target.result);
    localStorage.setItem("questions",JSON.stringify(questions));
    renderQuestions();
  };
  reader.readAsText(file);
});
