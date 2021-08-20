console.log("hello from sequence.js");

const putNumbersHere = document.getElementById("put-numbers-here");
const goButton = document.getElementById("go-button");
const stopButton = document.getElementById("stop-button");
var stopRequested = false;

function formatFibonacciNumber(n) {
  const container = document.createElement("span");

  const numberSpan = document.createElement("span");
  numberSpan.classList.add("fibonacci-number");
  numberSpan.appendChild(document.createTextNode(n));

  const separatorSpan = document.createElement("span");
  numberSpan.classList.add("separator");
  numberSpan.appendChild(document.createTextNode(", "));
  container.appendChild(numberSpan);
  container.appendChild(separatorSpan);
  return container;
}

const unicodeBomb = "\u{1F4A3}";
function indicateError() {
  return document.createTextNode(unicodeBomb);
}

const unicodeEllipsis = "…"
function indicateLoading() {
  const loadingSpan = document.createElement("span");
  loadingSpan.appendChild(document.createTextNode(unicodeEllipsis));
  return loadingSpan;
}

const unicodeStop = "⯃";
function indicateStop() {
  return document.createTextNode(unicodeStop);
}

function addNumbersToSequence(startingIndex) {
  const placeToPutTheNumber = document.createElement("span");
  putNumbersHere.appendChild(placeToPutTheNumber);

  if (stopRequested) {
    placeToPutTheNumber.appendChild(indicateStop());
    console.log("stopping");
    return;
  }

  placeToPutTheNumber.appendChild(indicateLoading());

  const i = startingIndex;
  const url = "/fib?index=" + i;
  fetch(url).then(response => {
    if (response.ok) {
      console.log("ok for " + i);
      response
        .json()
        .then(n => {
          placeToPutTheNumber.replaceChildren(formatFibonacciNumber(n));
          addNumbersToSequence(i + 1);
        }, err => {
          placeToPutTheNumber.replaceChildren(indicateError());
          console.log("parsing error on " + i);
        });
    } else {
      placeToPutTheNumber.replaceChildren(indicateError());
      console.log("error on " + i);
    }
  });
}

function go() {
  stopRequested = false;
  putNumbersHere.replaceChildren();
  addNumbersToSequence(0);
}

goButton.addEventListener("click", go);

function stop() {
  console.log("I hear you. Setting stopRequested");
  stopRequested = true;
}
stopButton.addEventListener("click", stop);
