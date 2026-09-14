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
const editButton = document.querySelector('.output__edit-btn')
const pitch = document.querySelector('.pitch')

const onInput = (event, outputElement) => {
  const value = event.target.value

  outputElement.textContent = value
}

// State to hold the last valid formation layout (defaults to 4-4-2)
let currentValidFormation = [4, 4, 2]

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

const updatePitchFormation = (formationArray) => {
  const pitchSection = document.querySelector('.pitch')
  const pitchPlayers = Array.from(document.querySelectorAll('.pitch__player'))
  const goalkeeper = pitchPlayers.find(
    (p) => p.querySelector('[data-player="1"]') !== null,
  )
  const outfieldCards = pitchPlayers.filter(
    (p) => p.querySelector('[data-player="1"]') === null,
  )
  const formation = document.querySelector('.pitch__formation')

  // Remove existing pitch rows
  pitchSection.querySelectorAll('.pitch__row').forEach((row) => row.remove())

  // Re-insert goalkeeper and formation (they stay outside rows)
  pitchSection.innerHTML = ''
  pitchSection.appendChild(goalkeeper)

  let playerIndex = 0
  formationArray.forEach((rowCount) => {
    const rowDiv = document.createElement('div')
    rowDiv.classList.add('pitch__row')
    for (let i = 0; i < rowCount; i++) {
      if (outfieldCards[playerIndex])
        rowDiv.appendChild(outfieldCards[playerIndex])
      playerIndex++
    }
    pitchSection.appendChild(rowDiv)
  })

  pitchSection.appendChild(formation)
}

// Initialize default attributes on load for the default 4-4-2 formation
updatePlayerFormationAttributes(currentValidFormation)
updatePitchFormation(currentValidFormation)

// Events
editButton.addEventListener('click', () => {
  pitch.scrollIntoView({ behavior: 'smooth' })
})

inputPlayerNumbers.forEach((inputPlayerNumber, index) => {
  inputPlayerNumber.addEventListener('input', (event) => {
    onInput(event, outputPlayerNumbers[index])
  })
})

inputPlayerNames.forEach((inputPlayerName, index) => {
  inputPlayerName.addEventListener('input', (event) => {
    onInput(event, outputPlayerNames[index])
  })
})

inputFormation.addEventListener('input', (event) => {
  const value = event.target.value.trim()
  const validation = validateFormation(value)

  if (validation.isValid) {
    currentValidFormation = validation.lines

    errorFormation.textContent = ''
    errorFormation.classList.remove('pitch__formation-error--visible')

    updatePlayerFormationAttributes(validation.lines)
    updatePitchFormation(validation.lines)
  } else {
    errorFormation.textContent = validation.message
    errorFormation.classList.add('pitch__formation-error--visible')
  }
})
