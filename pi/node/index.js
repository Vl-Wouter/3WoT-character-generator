/**
 * * Node.js version of Raspberry Pi Character Generator
 * Tried building this instead of redoing my Python Version
 */

/** Require packages */
const admin = require("firebase-admin")
const sense = require("sense-hat-led")
const consola = require("consola")

// Initialize firebase admin
const serviceAccount = require("../serviceAccount.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const db = admin.firestore()

// Fallback reset on app launch
sense.clear()

// Create document reference
const doc = db.collection('piConnection').doc('loopAvatars')


/**
 * Return a value between 0 and max
 * @param {Number} max Maximum value
 */
const randomValue = (max) => {
  return Math.floor(Math.random() * Math.floor(max))
}

/**
 * Reset the database loop trigger
 */
const resetTrigger = () => {
  db.collection('piConnection').doc('loopAvatars').set({
    isLooping: false
  })
  .catch(error => {
    consola.error(`Cannot reset database trigger: ${error}`)
  })
}

/**
 * Display an avatar on the sense hat
 * @param {Array} avatar Set of binary values of pixel states
 */
const displayAvatar = (avatar) => {
  const red = randomValue(255)
  const green = randomValue(255)
  const blue = randomValue(255)

  avatar.forEach((row, y) => {
    row.forEach((col, x) => {
      col === 1 ? sense.setPixel(x, y, red, green, blue) : sense.setPixel(x, y, 0)
    })
  })
}

/**
 * Loop through all available avatars
 * @param {Array} avatars Array of avatars
 */
const displayLoop = (avatars) => {
  let index = 0
  let loop = setInterval(() => {
    // Log looping character
    console.log(`Looping character ${index + 1}`)
    // call display on avatar
    displayAvatar(avatars[index])
    // check if loop is done
    if (index === (avatars.length - 1)) {
      // if loop is done wait 1 second to finish loop
      setTimeout(() => {
        consola.info('Ending loop and resetting DB trigger')
        sense.clear()
        clearInterval(loop)
        resetTrigger()
      }, 1000)
    } else {
      // else add 1 to index and loop again
      index++
    }
  }, 1000)
}

/**
 * Get all avatars and start loop
 */
const loopAvatars = () => {
  consola.info('Looping avatars on Pi')
  db.collection('avatars').get()
  .then(avatars => {
    const avatarPixels = []
    avatars.forEach(avatar => {
      const pixels = JSON.parse(avatar.data().array)
      avatarPixels.push(pixels)
    })
    displayLoop(avatarPixels)
  })
  .catch(error => {
    consola.fatal(`Encountered error: ${error}`)
  })
}

/**
 * Listener for database trigger
 */
const observer = doc.onSnapshot(snapshot => {
  consola.info('Received a new snapshot from database')
  const snapshotData = snapshot.data()
  const { isLooping } = snapshotData
  isLooping ? loopAvatars() : consola.info('No need to loop avatars')
}, err => consola.fatal(`Encountered an error: ${err}`))

/**
 * Exit process on CTRL+C
 */
process.on('SIGINT', () => {
  sense.clear()
  consola.info(`\n Interrupt detected, quitting application`)
  process.exit()
})