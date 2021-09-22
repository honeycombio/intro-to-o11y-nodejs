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
  separatorSpan.classList.add("separator");
  separatorSpan.appendChild(document.createTextNode(", "));
  container.appendChild(numberSpan);
  container.appendChild(separatorSpan);
  return container;
}

const unicodeBomb = "\u{1F4A3}";
function indicateError() {
  return document.createTextNode(unicodeBomb);
}

const unicodeEllipsis = "…";
function indicateLoading() {
  const loadingSpan = document.createElement("span");
  loadingSpan.appendChild(document.createTextNode(unicodeEllipsis));
  return loadingSpan;
}

const unicodeStop = "🛑";
function indicateStop() {
  return document.createTextNode(unicodeStop);
}

function setElementName(e, nameValue) {
  const nameAttribute = document.createAttribute("name");
  nameAttribute.value = nameValue;
  e.setAttributeNode(nameAttribute);
}

function addNumbersToSequence(startingIndex) {
  const sequenceSpan = document.createElement("span");
  setElementName(sequenceSpan, "sequence-results");
  putNumbersHere.appendChild(sequenceSpan);

  function addNumbersToSequenceInternal(index) {
    const placeToPutThisNumber = document.createElement("span");
    setElementName(placeToPutThisNumber, "fib-of-" + index);

    sequenceSpan.appendChild(placeToPutThisNumber);
    if (stopRequested) {
      placeToPutThisNumber.replaceChildren(indicateStop());
      console.log("stopping");
      buttonsReadyToGo();
      return;
    }

    placeToPutThisNumber.replaceChildren(indicateLoading());

    const i = index;
    const url = "/fib?index=" + i;
    fetch(url).then(response => {
      if (response.ok) {
        console.log("ok for " + i);
        response.json().then(
          n => {
            placeToPutThisNumber.replaceChildren(formatFibonacciNumber(n));
            addNumbersToSequenceInternal(i + 1);
          },
          err => {
            placeToPutThisNumber.replaceChildren(indicateError());
            console.log("parsing error on " + i);
          }
        );
      } else {
        placeToPutThisNumber.replaceChildren(indicateError());
        console.log("error on " + i);
      }
    });
  }
  addNumbersToSequenceInternal(startingIndex);
}

function buttonsReadyToGo() {
  stopButton.textContent = "Stop";
  goButton.disabled = false;
  stopButton.disabled = true;
}

function buttonsReadyToStop() {
  stopButton.textContent = "Stop";
  stopButton.disabled = false;
  goButton.disabled = true;
}

function buttonsWorkingOnStopping() {
  stopButton.textContent = "Stopping...";
}

function go() {
  stopRequested = false;
  putNumbersHere.replaceChildren();
  buttonsReadyToStop();
  addNumbersToSequence(0);
}
goButton.addEventListener("click", go);

function stop() {
  console.log("I hear you. Setting stopRequested");
  buttonsWorkingOnStopping();
  stopRequested = true;
}
stopButton.addEventListener("click", stop);

buttonsReadyToGo();
