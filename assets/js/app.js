// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBt1rN2oz9WSsb-t_z1RIw9PBslHGuEwZM",
    authDomain: "pi-server-cc2b0.firebaseapp.com",
    databaseURL: "https://pi-server-cc2b0.firebaseio.com",
    projectId: "pi-server-cc2b0",
    storageBucket: "pi-server-cc2b0.appspot.com",
    messagingSenderId: "544520465241",
    appId: "1:544520465241:web:b6474fec73d01c5c453a48"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const editorContainer = document.querySelector('#editorContainer')
const size = 8
const saveBtn = document.querySelector("#saveBtn")
const randomBtn = document.querySelector('#randomBtn')
const loginBtn = document.querySelector('#loginBtn')
const overlay = document.querySelector('.overlay')
const loopWebBtn = document.querySelector('#loopWebBtn')
const loopPiBtn = document.querySelector("#loopPiBtn")
const db = firebase.firestore()
let isLooping = false

function generateGrid(container, type, item = null) {
    for(let i = 0; i < size; i++) {
        const row = document.createElement('div')
        row.classList.add(`row`)
        for(let j = 0; j < size; j++) {
            const block = document.createElement('div')
            block.classList.add(`${type}__block`)
            if(item && item[i][j] == 1) block.classList.add('-on')
            block.addEventListener('click', switchState)
            row.appendChild(block)
        }
        container.appendChild(row)
    }
}

function initEditor() {  
    // Generate Editor Grid
    generateGrid(editorContainer, 'editor')

    // Add list items
    
}

// Log in user for current session
function loginUser() {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(function(){
        const email = document.querySelector('#email').value
        const password = document.querySelector('#password').value

        return firebase.auth().signInWithEmailAndPassword(email, password)
    })
    .then(user => {
      if(user) {
        initApp()
      } else {
        console.error('no user here!')
      }
    })
    .catch((error) => {
        console.error(error)
    })
}

firebase.auth().onAuthStateChanged((user) => {
  if(user) {
      overlay.classList.add('-hidden')
  } else {
      overlay.classList.remove('-hidden')
  }
})

loginBtn.addEventListener('click', (e) => {
  e.preventDefault()
  loginUser()
})

function initApp() {
  // Initialize app
  initEditor()
  saveBtn.addEventListener('click', saveAvatar)
  randomBtn.addEventListener('click', generateRandom)
  loopWebBtn.addEventListener('click', () => {
      !isLooping ? loopAvatars() : ""
  })
  loopPiBtn.addEventListener('click', loopOnPi)
  db.collection("avatars").onSnapshot((doc) => {
      generateList(doc)
  })
}

// Save avatar to db
function saveAvatar() {
    const rows = document.querySelectorAll('#editorContainer .row')
    const avatar = []
    rows.forEach(row => {
        const blocks = row.children
        const rowResult = []
        for (let block of blocks) {
            block.classList.contains('-on') ? rowResult.push(1) : rowResult.push(0)
        }
        avatar.push(rowResult)
    })
    console.log(avatar)
    db.collection("avatars").add({
        array: JSON.stringify(avatar)
    })
    .then((docRef) => console.log(docRef.id + 'Added to db'))
    .catch(err => console.error(err))
}

// Simple switch state test
function switchState(e) {
    console.log("clicked on a block")
    const block = e.target
    block.classList.toggle('-on');
}

// Reset the editor
function resetGenerator() {
    const blocks = document.querySelectorAll('.editor__block')
    blocks.forEach(block => {
        block.classList.contains('-on') ? block.classList.remove('-on') : ''
    })
}

// Generate random character
function generateRandom() {
    // Get all editor rows
    const rows = document.querySelectorAll('#editorContainer .row')
    // Reset all blocks to OFF
    resetGenerator()
    // Turn on random blocks in symmetrical pattern
    rows.forEach(row => {
        const blocks = row.children
        for(let i = 0; i < (blocks.length / 2); i++) {
            const offset = blocks.length - 1 - i
            if(Math.random() > 0.5) {
                blocks[i].classList.add('-on')
                blocks[offset].classList.add('-on')
            }
        }
    })
}

function generateList(items) {
    // Get List
    const list = document.querySelector('#characterContainer')
    // Empty list
    list.innerHTML = ""
    // Generate grids for items
    items.forEach(item => {
        const listItem = document.createElement('div')
        listItem.classList.add('list__item')
        // Create item
        const itemData = JSON.parse(item.data().array)
        itemData.forEach(row => {
            const rowElement = document.createElement('div')
            rowElement.classList.add('row')
            row.forEach(block => {
                const blockElement = document.createElement('div')
                blockElement.classList.add('list__block')
                if(block == 1) blockElement.classList.add('-on')
                rowElement.appendChild(blockElement)
            })
            listItem.appendChild(rowElement)
        })
        // Add item to list
        list.appendChild(listItem)
        listItem.addEventListener('click', () => displayAvatarOnGrid(itemData))
    })

}

// display avatar on grid
function displayAvatarOnGrid(item) {
    editorContainer.innerHTML = ""
    generateGrid(editorContainer, 'editor', item)
}

function loopAvatars() {
    isLooping = true
    db.collection('avatars').get()
    .then(snapshot => {
        const avatars = []
        snapshot.forEach((avatar, i) => {
            avatars.push(JSON.parse(avatar.data().array))
        })
        let i = 0;
        let loop = setInterval(() => {
            editorContainer.innerHTML = ""
            generateGrid(editorContainer, 'editor', avatars[i])

            if(i === avatars.length) {
                clearInterval(loop)
                isLooping = false
            } else {
                i++
            }
        }, 1000)
        
    })
}

// Send signal to pi
function startPiLoop() {
    db.collection('piConnection').doc('loopAvatars').set({
        isLooping: true
    })
}

// Check Pi Signal
function loopOnPi() {
    // Check if status is already true
    db.collection('piConnection').doc('loopAvatars').get()
    .then(doc => {
        if (doc.exists) {
            const docData = doc.data()
            if(docData.isLooping === false) startPiLoop()
        } else {
            console.log('no doc here')
        }
    })
}