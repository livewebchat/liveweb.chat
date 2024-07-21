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

////////////////////
//// ADD STYLES ////
////////////////////

const stylesLink = document.createElement("link")
stylesLink.rel = "stylesheet"
stylesLink.href = "./live-chat-api.css"
document.head.appendChild(stylesLink)

///////////////////
//// ADD FONTS ////
///////////////////

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
  "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
document.head.appendChild(fontGoogleCDN)

/////////////////////////
//// CREATE ELEMENTS ////
/////////////////////////

const floatingButton = document.createElement("div")
floatingButton.id = "floatingButton"
floatingButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linejoin="round"><path stroke-linecap="round" stroke-width="2.5" d="M12 21a9 9 0 1 0-8-4.873L3 21l4.873-1c1.236.639 2.64 1 4.127 1"/><path stroke-width="3.75" d="M7.5 12h.01v.01H7.5zm4.5 0h.01v.01H12zm4.5 0h.01v.01h-.01z"/></g></svg>`
document.body.appendChild(floatingButton)

const chatWrapper = document.createElement("div")
chatWrapper.id = "chatWrapper"
document.body.appendChild(chatWrapper)

const chatHeader = document.createElement("div")
chatHeader.id = "chatHeader"
chatHeader.innerHTML = `<span id="chatStatusIcon"></span><span id="chatHeaderConnectingText">Connecting you to a specialist...</span>`
chatWrapper.appendChild(chatHeader)

const chatHideButton = document.createElement("button")
chatHideButton.id = "chatHideButton"
chatHideButton.type = "button"
chatHideButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M2 11.999c0-5.523 4.477-10 10-10s10 4.477 10 10s-4.477 10-10 10s-10-4.477-10-10m13.707-3.706a1 1 0 0 1 0 1.414L13.414 12l2.293 2.293a1 1 0 0 1-1.414 1.414L12 13.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L10.586 12L8.293 9.707a1 1 0 0 1 1.414-1.414L12 10.586l2.293-2.293a1 1 0 0 1 1.414 0" clip-rule="evenodd"/></svg>`
chatHeader.appendChild(chatHideButton)

const chatBody = document.createElement("div")
chatBody.id = "chatBody"
chatWrapper.appendChild(chatBody)

const chatBottomWrapper = document.createElement("div")
chatBottomWrapper.id = "chatBottomWrapper"
chatWrapper.appendChild(chatBottomWrapper)

const chatTextInput = document.createElement("textarea")
chatTextInput.id = "chatTextInput"
chatTextInput.rows = 1
chatBottomWrapper.appendChild(chatTextInput)

const chatWith = document.querySelector("#chat_header_user_email")
const messagesWrapper = document.querySelector("#messages_wrapper")
const messageInput = document.querySelector("#message_input")
const messageSend = document.querySelector("#message_send")

// Requests
const createSession = async (userEmail) => {
  const response = await fetch(`${API_URL}/createSession`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userEmail }),
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

const getSession = async (userEmail) => {
  const response = await fetch(
    `${API_URL}/getSession?userEmail=${encodeURIComponent(userEmail)}`
  )
  return await response.json()
}

const convertFirestoreTimestamp = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000)
  return date.toLocaleString()
}

const updateUI = (sessionData) => {
  chatWith.innerHTML = sessionData.userEmail

  messagesWrapper.innerHTML = ""
  sessionData.messages.forEach((message) => {
    const messageEl = document.createElement("div")
    messageEl.classList.add("message")
    messageEl.innerHTML = message.text

    if (message.sender === sessionData.userEmail) {
      messageEl.classList.add("message-left")
    } else {
      messageEl.classList.add("message-right")
    }

    messagesWrapper.appendChild(messageEl)
  })

  messagesWrapper.scrollTop = messagesWrapper.scrollHeight
}

const sessionId = "yIK5XAyHc1nGywDPD9oS"
const sessionRef = doc(db, "chatSessions", sessionId)

onSnapshot(sessionRef, (doc) => {
  if (doc.exists()) {
    const sessionData = doc.data()
    updateUI(sessionData)
  }
})

const handleSendMessage = async () => {
  const text = messageInput.value
  if (text.trim() !== "") {
    await sendMessage(sessionId, "example@mail.com", text)
    messageInput.value = ""
  }
}

messageSend.addEventListener("click", handleSendMessage)
messageInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || e.keyCode === 13) handleSendMessage()
})

const initialize = async () => {
  const session = await getSession("example@mail.com")

  if (session) {
    chatWith.innerHTML = session.userEmail

    session.messages.forEach((message) => {
      const messageEl = document.createElement("div")
      messageEl.classList.add("message")
      messageEl.innerHTML = message.text

      if (message.sender === session.userEmail) {
        messageEl.classList.add("message-left")
      } else {
        messageEl.classList.add("message-right")
      }

      messagesWrapper.appendChild(messageEl)
    })

    messagesWrapper.scrollTop = messagesWrapper.scrollHeight
  }
}

initialize()
