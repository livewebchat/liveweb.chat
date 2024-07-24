import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js"
import {
  getFirestore,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyAZ7ssehiFBoQtVVjC7lhUf0doboUUh0Yo",
  authDomain: "live-chat-web-api.firebaseapp.com",
  databaseURL:
    "https://live-chat-web-api-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "live-chat-web-api",
  storageBucket: "live-chat-web-api.appspot.com",
  messagingSenderId: "328858733673",
  appId: "1:328858733673:web:333af027ddaad12baf26f8",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const API_URL = "https://us-central1-live-chat-web-api.cloudfunctions.net"
let CURRENT_USER_IP = ""
let CURRENT_SESSION_ID = ""

async function getUserIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json")
    const data = await response.json()
    const sessionId = await getSession(data.ip)

    return data.ip
  } catch (error) {
    console.error("Error fetching IP address:", error)
    document.getElementById("ipAddress").innerText =
      "Unable to retrieve IP address"
  }
}

/////////////////
//// Helpers ////
/////////////////

const convertFirestoreTimestamp = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000)
  return date.toLocaleString()
}

const convertFirestoreTimestampToReadable = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000)
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const day = date.getUTCDate()
  const month = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const formattedHours = ("0" + hours).slice(-2)
  const formattedMinutes = ("0" + minutes).slice(-2)
  const formattedDate = `${day} ${month} ${year}, ${formattedHours}:${formattedMinutes}`
  return formattedDate
}

const urlify = (text) => {
  var urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, function (url) {
    return `<a href="${url}" target="blank">${url}</a>`
  })
}

//////////////////
//// Requests ////
//////////////////

const createSession = async (userIPaddress) => {
  const response = await fetch(`${API_URL}/createSession`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIPaddress }),
  })

  return await response.json()
}

const sendMessage = async (sessionId, sender, text) => {
  const response = await fetch(`${API_URL}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, sender, text }),
  })

  return await response.json()
}

const getSession = async (userIPaddress) => {
  const response = await fetch(
    `${API_URL}/getSession?userIPaddress=${encodeURIComponent(userIPaddress)}`
  )

  return await response.json()
}

/////////////////
//// Styles ////
////////////////

const stylesLink = document.createElement("link")
stylesLink.rel = "stylesheet"
stylesLink.href = "./live-chat-api.css"
document.head.appendChild(stylesLink)

///////////////
//// Fonts ////
///////////////

const fontPreconnectGoogleApis = document.createElement("link")
fontPreconnectGoogleApis.rel = "preconnect"
fontPreconnectGoogleApis.href = "https://fonts.googleapis.com"
document.head.appendChild(fontPreconnectGoogleApis)

const fontPreconnectGoogleStatic = document.createElement("link")
fontPreconnectGoogleStatic.rel = "preconnect"
fontPreconnectGoogleApis.href = "https://fonts.gstatic.com"
fontPreconnectGoogleApis.crossOrigin = true
document.head.appendChild(fontPreconnectGoogleStatic)

const fontGoogleCDN = document.createElement("link")
fontGoogleCDN.rel = "stylesheet"
fontGoogleCDN.href =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
document.head.appendChild(fontGoogleCDN)

//////////////////////
//// UI Functions ////
//////////////////////

// Toggle chat in/out of view
const hideChat = () => {
  chatWrapper.classList.remove("show")
}

const toggleChat = () => {
  chatWrapper.classList.toggle("show")
}

const createMessage = ({ from, text, sending }) => {
  const message = document.createElement("div")
  message.classList.add("chatMessage")
  message.innerHTML = `<span>${urlify(text)}</span>`

  if (from === CURRENT_USER_IP) message.classList.add("chatMessageFrom")
  if (sending) {
    message.classList.add("chatMessageSending")
    message.innerHTML += `<svg class="sendingMessageIndicator" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"/><rect width="2" height="7" x="11" y="6" fill="currentColor" rx="1"><animateTransform attributeName="transform" dur="9s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></rect><rect width="2" height="9" x="11" y="11" fill="currentColor" rx="1"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></rect></svg>`
  }

  chatBody.appendChild(message)
}

const handleSendMessage = async () => {
  const text = chatTextInput.value
  if (text.trim() !== "") {
    createMessage({ from: CURRENT_USER_IP, text, sending: true })
    chatTextInput.value = ""
    chatBody.scrollTop = chatBody.scrollHeight
    chatWrapper.classList.remove("has-value")

    await sendMessage(CURRENT_SESSION_ID, CURRENT_USER_IP, text)
  }
}

///////////////////
//// Elements ////
//////////////////

const chatWrapper = document.createElement("div")
chatWrapper.id = "chatWrapper"
document.body.appendChild(chatWrapper)

const floatingButton = document.createElement("div")
floatingButton.id = "floatingButton"
floatingButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linejoin="round"><path stroke-linecap="round" stroke-width="2.5" d="M12 21a9 9 0 1 0-8-4.873L3 21l4.873-1c1.236.639 2.64 1 4.127 1"/><path stroke-width="3.75" d="M7.5 12h.01v.01H7.5zm4.5 0h.01v.01H12zm4.5 0h.01v.01h-.01z"/></g></svg>`
chatWrapper.appendChild(floatingButton)

const chat = document.createElement("div")
chat.id = "chat"
chatWrapper.appendChild(chat)

const chatHeader = document.createElement("div")
chatHeader.id = "chatHeader"
chat.appendChild(chatHeader)

const chatConnectingIcon = document.createElement("span")
chatConnectingIcon.id = "chatConnectingIcon"
chatConnectingIcon.innerHTML = `<svg id="chatConnectingIcon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g stroke="currentColor"><circle cx="12" cy="12" r="9.5" fill="none" stroke-linecap="round" stroke-width="3"><animate attributeName="stroke-dasharray" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0 150;42 150;42 150;42 150"/><animate attributeName="stroke-dashoffset" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0;-16;-59;-59"/></circle><animateTransform attributeName="transform" dur="2s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></g></svg>`
chatHeader.appendChild(chatConnectingIcon)

const chatConnectedIcon = document.createElement("span")
chatConnectedIcon.id = "chatConnectedIcon"
chatHeader.appendChild(chatConnectedIcon)

const chatHeaderStatusText = document.createElement("span")
chatHeaderStatusText.id = "chatHeaderStatusText"
chatHeaderStatusText.innerHTML = "Connecting you to a specialist..."
chatHeader.appendChild(chatHeaderStatusText)

const chatHideButton = document.createElement("button")
chatHideButton.id = "chatHideButton"
chatHideButton.type = "button"
chatHideButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12m7.707-1.707a1 1 0 1 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l3-3a1 1 0 0 0-1.414-1.414L12 12.586z" clip-rule="evenodd"/></svg>`
chatHideButton.addEventListener("click", hideChat)
chatHeader.appendChild(chatHideButton)

const chatBody = document.createElement("div")
chatBody.id = "chatBody"
chat.appendChild(chatBody)

const chatInitializingLoader = document.createElement("span")
chatInitializingLoader.id = "chatInitializingLoader"
chatInitializingLoader.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g stroke="currentColor"><circle cx="12" cy="12" r="9.5" fill="none" stroke-linecap="round" stroke-width="3"><animate attributeName="stroke-dasharray" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0 150;42 150;42 150;42 150"/><animate attributeName="stroke-dashoffset" calcMode="spline" dur="1.5s" keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1" keyTimes="0;0.475;0.95;1" repeatCount="indefinite" values="0;-16;-59;-59"/></circle><animateTransform attributeName="transform" dur="2s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></g></svg>`

const chatNoMessages = document.createElement("span")
chatNoMessages.id = "chatNoMessages"
chatNoMessages.innerHTML = `Ask about anything you wonder!`

const chatBottomWrapper = document.createElement("div")
chatBottomWrapper.id = "chatBottomWrapper"
chat.appendChild(chatBottomWrapper)

const chatTextInputWrapper = document.createElement("div")
chatTextInputWrapper.id = "chatTextInputWrapper"
chatBottomWrapper.appendChild(chatTextInputWrapper)

const chatTextInput = document.createElement("textarea")
chatTextInput.id = "chatTextInput"
chatTextInput.rows = 1
chatTextInput.setAttribute("placeholder", "Send a message...")
chatTextInputWrapper.appendChild(chatTextInput)

const chatSendButton = document.createElement("button")
chatSendButton.id = "chatSendButton"
chatSendButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M3.402 6.673c-.26-2.334 2.143-4.048 4.266-3.042l11.944 5.658c2.288 1.083 2.288 4.339 0 5.422L7.668 20.37c-2.123 1.006-4.525-.708-4.266-3.042L3.882 13H12a1 1 0 1 0 0-2H3.883z" clip-rule="evenodd"/></svg>`
chatTextInputWrapper.appendChild(chatSendButton)

/////////////////////////
//// Event Listeners ////
/////////////////////////

chatTextInput.addEventListener("keyup", (e) => {
  if (e.target.value) chatWrapper.classList.add("has-value")
  else chatWrapper.classList.remove("has-value")
})

document.addEventListener("click", (event) => {
  const onChat = event.composedPath().includes(chat)
  const onFloatingButton = event.composedPath().includes(floatingButton)
  if (!onChat && !onFloatingButton) hideChat()
})

chatSendButton.addEventListener("click", handleSendMessage)
chatTextInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
})

// Initialize App

const updateUI = (sessionData) => {
  if (sessionData) {
    chatBody.innerHTML = ""

    if (sessionData.remote && sessionData.remote.connected) {
      chatConnectingIcon.style.display = "none"
      chatConnectedIcon.style.display = "block"

      chatHeaderStatusText.innerHTML = `${sessionData.remote.name}<span id="chatHeaderStatusAvailable">Available</span>`
    }

    if (!sessionData.messages || !sessionData.messages.length) {
      chatBody.appendChild(chatNoMessages)
    } else {
      sessionData.messages.forEach((message) => {
        createMessage({
          from: message.sender,
          text: message.text,
          sending: false,
        })
      })

      const lastActiveFormattedDate = convertFirestoreTimestampToReadable(
        sessionData.lastActive
      )
      chatBody.innerHTML += `<span id="chatLastMessageTime">${lastActiveFormattedDate}</span>`
      chatBody.scrollTop = chatBody.scrollHeight
    }
  }
}

async function initializeSession() {
  chatBody.appendChild(chatInitializingLoader)

  CURRENT_USER_IP = await getUserIP()

  let sessionRef = undefined
  const session = await getSession(CURRENT_USER_IP)

  if (session && session.active == true) {
    CURRENT_SESSION_ID = session.id
    sessionRef = doc(db, "chatSessions", CURRENT_SESSION_ID)
  } else {
    const newSession = await createSession(CURRENT_USER_IP)
    CURRENT_SESSION_ID = newSession.id
    sessionRef = doc(db, "chatSessions", CURRENT_SESSION_ID)
  }

  onSnapshot(sessionRef, (doc) => {
    if (doc.exists()) {
      const sessionData = doc.data()
      updateUI(sessionData)
    }
  })
}

let isFirstInit = true
floatingButton.addEventListener("click", async () => {
  if (isFirstInit) {
    toggleChat()
    await initializeSession()
    isFirstInit = false
  }
})
