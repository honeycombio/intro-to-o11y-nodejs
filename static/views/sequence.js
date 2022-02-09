console.log("hello from sequence.js");

const putNumbersHere = document.getElementById("put-numbers-here");
const goButton = document.getElementById("go-button");
const stopButton = document.getElementById("stop-button");
const autoButton = document.getElementById("auto-checkbox");
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

const pauseBetweenRequests = 200; // because otherwise it doesn't work when the backend gets fast

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
            placeToPutThisNumber.replaceChildren(formatFibonacciNumber(n.fibonacciNumber));
            setTimeout(() => addNumbersToSequenceInternal(i + 1), pauseBetweenRequests);
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

let autoModeDesired = false;
let autoModeActive = false;
function auto(clickEvent) {
  const nextAutoMode = clickEvent.target.checked;
  console.log("you pushed auto. Is it checked now? " + nextAutoMode);
  if (nextAutoMode == false) {
    autoModeDesired = false;
    return;
  }
  if (autoModeActive) {
    console.log("auto mode is already happening");
    return;
  }
  // OK. Now activate autoMode.
  const stepOne = go;
  const afterStepOneWaitMs = () => Math.floor(Math.random() * 3000) + 1000;
  const stepTwo = stop;
  const afterStepTwoWaitCondition = () => !goButton.disabled
  const checkEveryMs = 210;
  const repeatCondition = () => autoModeDesired

  const doStuff = () => {
    autoModeActive = true;
    stepOne();
    const weDidIt = () => {
      console.log("We did it!")
      if (repeatCondition()) {
        console.log("Starting again...")
        doStuff();
      } else {
        console.log("Whew! We are done")
        autoModeActive = false;
      }
    }
    const continueWithStepTwo = () => {
      stepTwo();
      const checkAndContinue = () => {
        if (afterStepTwoWaitCondition()) {
          weDidIt();
        } else {
          console.log("Not ready yet. Checking again in " + checkEveryMs)
          setTimeout(checkAndContinue, checkEveryMs);
        }
      }
      setTimeout(checkAndContinue, checkEveryMs);
    }
    const wait = afterStepOneWaitMs();
    console.log("Auto mode is chilling for ", wait);
    setTimeout(continueWithStepTwo, wait);
  }
  autoModeDesired = true;
  doStuff();
}
autoButton.addEventListener("click", auto);

buttonsReadyToGo();
