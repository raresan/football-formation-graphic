'use strict'

const inputPlayerNumbers = document.querySelectorAll(
  '.pitch__player-number-input',
)
const inputPlayerNames = document.querySelectorAll('.pitch__player-name-input')
const outputPlayers = document.querySelectorAll('.output__player')
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

// Function to update formations and wrap outfield players into row containers dynamically
const updatePlayerFormationAttributes = (formationArray) => {
  const outputField = document.querySelector('.output')

  // Remove existing row wrappers if any, to rebuild them cleanly
  const existingRows = outputField.querySelectorAll('.output__row')
  existingRows.forEach((row) => {
    while (row.firstChild) {
      outputField.insertBefore(row.firstChild, row)
    }
    row.remove()
  })

  // Filter out player 1 (goalkeeper) and get outfield players (2 to 11)
  const outfieldPlayers = Array.from(outputPlayers).filter(
    (player) =>
      player.querySelector('[data-player]').getAttribute('data-player') !== '1',
  )

  let playerIndex = 0

  // Loop through each row count in the formation array (e.g., 4, 3, 3)
  formationArray.forEach((rowCount, rowIndex) => {
    // Create a row wrapper div for horizontal flex distribution
    const rowDiv = document.createElement('div')
    rowDiv.classList.add('output__row')
    rowDiv.setAttribute('data-row', rowIndex + 1)

    // Append the exact number of players belonging to this row
    for (let i = 0; i < rowCount; i++) {
      const player = outfieldPlayers[playerIndex]
      if (player) {
        player.setAttribute('data-row', rowIndex + 1)
        player.setAttribute('data-row-position', i + 1)
        rowDiv.appendChild(player) // Moves the player inside the row wrapper
      }
      playerIndex++
    }

    // Insert the row wrapper into the output field container
    outputField.appendChild(rowDiv)
  })
}

// Initialize default attributes on load for the default 4-3-3 formation
updatePlayerFormationAttributes(currentValidFormation)

inputFormation.addEventListener('input', (event) => {
  const value = event.target.value.trim()
  const validation = validateFormation(value)

  if (validation.isValid) {
    currentValidFormation = validation.lines // Update global state

    errorFormation.textContent = ''
    errorFormation.classList.remove('pitch__formation-error--visible')

    // Update the data attributes on the DOM elements without recreating them
    updatePlayerFormationAttributes(validation.lines)
  } else {
    errorFormation.textContent = validation.message
    errorFormation.classList.add('pitch__formation-error--visible')
  }
})
