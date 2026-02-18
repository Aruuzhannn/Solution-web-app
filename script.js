const RESULTS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbw1mP2CMXPrKhuwH3tClUiDZIt-5-sHPQgg8M2uRDAGEZ4FYu_tLyemFOGaBEqobZwQow/exec";

let studentName = "";
let currentIndex = 0;

let attemptsThisTask = 0;
let hadWrongOnce = false;
let hintsUsed = 0;
let hintLevel = 0;

let totalScore = 0;

let errorStats = {
  formulaError: 0,
  unitError: 0,
  logicError: 0
};

const tasks = [
  { id:"L1-Q1", level:1,
    question:"1) 250 мл көлемдегі 0,20 М NaOH ерітіндісін дайындау үшін қанша грамм NaOH қажет?",
    answer:2.00, unit:"g", tolerance:0.01, errorType:"formulaError",
    hints:[
      "Подсказка 1: n = C·V. V-ді литрге айналдыр.",
      "Подсказка 2: 250 мл = 0,250 л. n = 0,20·0,250.",
      "Подсказка 3: m = n·M. NaOH үшін M = 40 г/моль."
    ]
  },
  { id:"L1-Q2", level:1,
    question:"2) 150 мл көлемдегі 0,6 Н H₂SO₄ ерітіндісін дайындау үшін қанша грамм H₂SO₄ керек?",
    answer:4.41, unit:"g", tolerance:0.05, errorType:"formulaError",
    hints:[
      "Подсказка 1: Нормалдық: n(экв) = N·V.",
      "Подсказка 2: H₂SO₄ үшін n-factor = 2, сонда Mэкв = M/2.",
      "Подсказка 3: m = n(экв)·Mэкв. V=0,150 л екенін ұмытпа."
    ]
  },
  { id:"L2-Q3", level:2,
    question:"3) 400 мл ерітінді құрамында 2,45 г H₃PO₄ бар. Ерітіндінің нормалдық концентрациясын табыңдар.",
    answer:0.1875, unit:"N", tolerance:0.002, errorType:"logicError",
    hints:[
      "Подсказка 1: N = n(экв)/V. Алдымен n(экв) тап.",
      "Подсказка 2: n(экв) = m / Mэкв. H₃PO₄ үшін Mэкв = M/3.",
      "Подсказка 3: Қадам: M(H₃PO₄) → Mэкв → n(экв) → V(л) → N."
    ]
  },
  { id:"L2-Q4", level:2,
    question:"4) 500 мл көлемдегі 0,15 Н Ca(OH)₂ ерітіндісін дайындау үшін қанша грамм Ca(OH)₂ қажет?",
    answer:2.78, unit:"g", tolerance:0.03, errorType:"formulaError",
    hints:[
      "Подсказка 1: n(экв)=N·V.",
      "Подсказка 2: Ca(OH)₂ үшін n-factor = 2 → Mэкв = M/2.",
      "Подсказка 3: m = N·V·Mэкв. V=0,500 л."
    ]
  },
  { id:"L2-Q5", level:2,
    question:"5) 200 мл 0,30 Н NaOH және 100 мл 0,60 Н NaOH араластырылды. Қоспаның нормалдық концентрациясын табыңдар.",
    answer:0.40, unit:"N", tolerance:0.005, errorType:"logicError",
    hints:[
      "Подсказка 1: N1V1 + N2V2 (экв саны қосылады).",
      "Подсказка 2: Nқоспа = (N1V1 + N2V2) / (V1+V2).",
      "Подсказка 3: Бұл жай орташа емес — салмақталған орташа."
    ]
  },
  { id:"L3-Q6", level:3,
    question:"6) 98% H₂SO₄ (ρ=1,84 г/мл) арқылы 250 мл 2,0 Н H₂SO₄ дайындау үшін қанша мл концентрлі қышқыл алу керек?",
    answer:13.60, unit:"mL", tolerance:0.20, errorType:"logicError",
    hints:[
      "Подсказка 1: n(экв)=N·V. V=0,250 л.",
      "Подсказка 2: mтаза = n(экв)·Mэкв (H₂SO₄: Mэкв=M/2).",
      "Подсказка 3: mеріт=mтаза/0.98, V = mеріт/ρ."
    ]
  },
  { id:"L3-Q7", level:3,
    question:"7) 100 мл 0,50 М H₂SO₄ және 200 мл 0,30 М H₃PO₄ араластырылды. Қоспаның жалпы нормалдық концентрациясын есептеңдер.",
    answer:0.9333, unit:"N", tolerance:0.01, errorType:"formulaError",
    hints:[
      "Подсказка 1: Әр ерітінді үшін N = M·n-factor.",
      "Подсказка 2: H₂SO₄ үшін n=2, H₃PO₄ үшін n=3.",
      "Подсказка 3: Nқоспа = (N1V1+N2V2)/(V1+V2), V литрмен."
    ]
  }
];

function $(id){ return document.getElementById(id); }

function storageKey(){ return "ecl_" + studentName; }

function showInfo(msg, type=""){
  const box = $("infoBox");
  box.className = "info";
  if(type === "ok") box.classList.add("ok");
  if(type === "danger") box.classList.add("danger");
  box.innerText = msg;
  box.style.display = "block";
}
function hideInfo(){
  $("infoBox").style.display = "none";
  $("infoBox").innerText = "";
  $("infoBox").className = "info";
}

function resetTaskRunState(){
  attemptsThisTask = 0;
  hadWrongOnce = false;
  hintsUsed = 0;
  hintLevel = 0;
  $("answerInput").value = "";
  $("unitSelect").value = "";
  hideInfo();
}

function updateUI(){
  if(!studentName) return;
  $("statusPill").innerText = "Кірген: " + studentName;

  const t = tasks[currentIndex];
  if(!t){
    $("levelPill").innerText = "Аяқталды";
    $("question").innerText = "Барлық есептер аяқталды 🎉";
    showInfo("Жалпы балл: " + totalScore.toFixed(2), "ok");
    return;
  }

  $("levelPill").innerText = "Деңгей: " + t.level;
  $("question").innerText = t.question;

  $("stats").innerHTML =
    `<b>Прогресс:</b> ${currentIndex}/${tasks.length} | ` +
    `<b>Балл:</b> ${totalScore.toFixed(2)}<br>` +
    `<b>Қате:</b> формула=${errorStats.formulaError}, бірлік=${errorStats.unitError}, логика=${errorStats.logicError}<br>` +
    `<b>Бұл есеп:</b> әрекет=${attemptsThisTask}, подсказка=${hintsUsed}`;
}

function saveLocal(){
  if(!studentName) return;
  localStorage.setItem(storageKey(), JSON.stringify({ currentIndex, totalScore, errorStats }));
}

function loadLocal(){
  const raw = localStorage.getItem(storageKey());
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    currentIndex = Number.isInteger(data.currentIndex) ? data.currentIndex : 0;
    totalScore = typeof data.totalScore === "number" ? data.totalScore : 0;
    if(data.errorStats) errorStats = { ...errorStats, ...data.errorStats };
  }catch(e){}
}

async function sendToSheet(payload){
  try{
    await fetch(RESULTS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  }catch(e){}
}

function awardScore(){
  if(hintsUsed > 0) return 0.3;
  if(hadWrongOnce) return 0.5;
  return 1.0;
}

function login(){
  const name = $("studentNameInput").value.trim();
  if(!name) return alert("Атыңды енгіз!");
  studentName = name;
  localStorage.setItem("currentStudent", studentName);

  $("loginSection").style.display = "none";
  $("appSection").style.display = "block";
  $("welcome").innerText = "Қош келдің, " + studentName + "!";

  loadLocal();
  resetTaskRunState();
  updateUI();
}

function logout(){
  localStorage.removeItem("currentStudent");
  location.reload();
}

function clearLocal(){
  const saved = localStorage.getItem("currentStudent");
  if(saved) localStorage.removeItem("ecl_" + saved);
  localStorage.removeItem("currentStudent");
  alert("Жергілікті деректер тазаланды.");
}

function showHint(){
  const t = tasks[currentIndex];
  if(!t) return;
  hintsUsed += 1;
  const msg = t.hints[Math.min(hintLevel, t.hints.length - 1)];
  hintLevel = Math.min(hintLevel + 1, t.hints.length - 1);
  showInfo(msg);
  updateUI();
  saveLocal();
}

function unitMismatch(expected){
  const u = $("unitSelect").value;
  if(!u) return true;
  return u !== expected;
}
function numericOk(value, target, tol){
  return Math.abs(value - target) <= tol;
}

async function submitAnswer(){
  const t = tasks[currentIndex];
  if(!t) return;

  const vRaw = $("answerInput").value;
  const unit = $("unitSelect").value;

  if(vRaw === "") return showInfo("Жауап санын енгіз.", "danger");

  const value = parseFloat(vRaw);
  if(Number.isNaN(value)) return showInfo("Сан дұрыс енгізілмеді.", "danger");

  attemptsThisTask += 1;

  if(unitMismatch(t.unit)){
    errorStats.unitError += 1;
    hadWrongOnce = true;
    showInfo("Бірлік қате ❌ Дұрыс бірлікті таңда.", "danger");
    updateUI(); saveLocal();
    return;
  }

  if(numericOk(value, t.answer, t.tolerance)){
    const gained = awardScore();
    totalScore += gained;

    await sendToSheet({
      event:"task_solved",
      studentName,
      taskId:t.id,
      level:t.level,
      answerGiven:value,
      unitGiven:unit,
      correctAnswer:t.answer,
      correctUnit:t.unit,
      attempts:attemptsThisTask,
      hintsUsed,
      hadWrongOnce,
      scoreGained:gained,
      totalScore,
      errorStats,
      timestamp:new Date().toISOString()
    });

    showInfo("Дұрыс ✅ Балл: +" + gained.toFixed(2), "ok");

    currentIndex += 1;
    saveLocal();

    setTimeout(() => {
      resetTaskRunState();
      updateUI();
    }, 450);
    return;
  }

  errorStats[t.errorType] += 1;
  hadWrongOnce = true;

  await sendToSheet({
    event:"attempt_wrong",
    studentName,
    taskId:t.id,
    level:t.level,
    answerGiven:value,
    unitGiven:unit,
    attempts:attemptsThisTask,
    hintsUsed,
    errorType:t.errorType,
    errorStats,
    timestamp:new Date().toISOString()
  });

  if(attemptsThisTask === 1){
    showInfo("Қате ❌ Бір рет қайта байқап көр. Қаласаң подсказка қолдан.", "danger");
  } else {
    showInfo("Қате ❌ Подсказка қолдан да қайта көр.", "danger");
  }

  updateUI();
  saveLocal();
}

window.onload = function(){
  const saved = localStorage.getItem("currentStudent");
  if(saved){
    studentName = saved;
    $("loginSection").style.display = "none";
    $("appSection").style.display = "block";
    $("welcome").innerText = "Қош келдің, " + studentName + "!";
    loadLocal();
    resetTaskRunState();
    updateUI();
  }
};
