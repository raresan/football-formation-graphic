'use strict'

const inputPlayerNumbers = document.querySelectorAll(
  '.pitch__player-number-input',
)
const inputPlayerNames = document.querySelectorAll('.pitch__player-name-input')
const outputPlayerNumbers = document.querySelectorAll('.output__player-number')
const outputPlayerNames = document.querySelectorAll('.output__player-name')
const inputFormation = document.querySelector('.pitch__formation-input')
const errorFormation = document.querySelector('.pitch__formation-error')

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

// State to hold the last valid formation layout (defaults to 4-3-3)
let currentValidFormation = [4, 3, 3]

const validateFormation = (formationString) => {
  // Regex to validate basic format: numbers separated by hyphens (e.g., 4-3-3, 4-2-3-1)
  const regexFormat = /^\d+(-\d+)*$/

  if (!regexFormat.test(formationString)) {
    return {
      isValid: false,
      message:
        'Invalid format. Use numbers separated by hyphens only (e.g., 4-3-3).',
    }
  }

  // Convert string to an array of numbers
  const numbers = formationString.split('-').map(Number)

  // Check individual line limits (e.g., each line must have between 1 and 5 players to prevent layout breakage)
  const hasInvalidRows = numbers.some((count) => count < 1 || count > 5)
  if (hasInvalidRows) {
    return {
      isValid: false,
      message: 'Each line must have between 1 and 5 players.',
    }
  }

  // Business rule: the sum of outfield players must be exactly 10
  const totalPlayers = numbers.reduce(
    (accumulator, current) => accumulator + current,
    0,
  )

  if (totalPlayers !== 10) {
    return {
      isValid: false,
      message: `The formation has ${totalPlayers} outfield players. The total must be exactly 10.`,
    }
  }

  // Returns valid state and the parsed lines array
  return { isValid: true, lines: numbers }
}

// Event listener for the formation input
inputFormation.addEventListener('change', (event) => {
  const value = event.target.value.trim()
  const validation = validateFormation(value)

  if (validation.isValid) {
    console.log('Valid formation!', validation.lines)
    currentValidFormation = validation.lines // Update global state

    errorFormation.textContent = ''
    errorFormation.classList.remove('pitch__formation-error--visible')

    // TODO: Trigger function to redraw players on the field using 'currentValidFormation'
  } else {
    console.warn('Validation warning:', validation.message)

    errorFormation.textContent = validation.message
    errorFormation.classList.add('pitch__formation-error--visible')
  }
})
