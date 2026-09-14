'use strict'

const inputPlayerNumbers = document.querySelectorAll(
  '.pitch__player-number-input',
)
const inputPlayerNames = document.querySelectorAll('.pitch__player-name-input')
const outputPlayerNumbers = document.querySelectorAll('.output__player-number')
const outputPlayerNames = document.querySelectorAll('.output__player-name')

const onInput = (event, outputElement) => {
  const value = event.target.value

  outputElement.textContent = value
}

// Number Events
inputPlayerNumbers.forEach((inputPlayerNumber, index) => {
  inputPlayerNumber.addEventListener('input', (event) => {
    onInput(event, outputPlayerNumbers[index])
  })
})

// Name Events
inputPlayerNames.forEach((inputPlayerName, index) => {
  inputPlayerName.addEventListener('input', (event) => {
    onInput(event, outputPlayerNames[index])
  })
})
