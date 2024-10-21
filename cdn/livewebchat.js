"use strict"

import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js"
const API_URL = "https://liveweb.chat/api"
const socket = io(API_URL)

let CURRENT_USER_IP = null
let CURRENT_SESSION_ID = null

/////////////////
//// Helpers ////
/////////////////

;(() => {
  const cssLink = document.createElement("link")
  cssLink.rel = "stylesheet"
  cssLink.href = "https://cdn.liveweb.chat/livewebchat.css"
  document.head.appendChild(cssLink)
})()

async function getUserIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json")
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error("Error fetching IP address:", error)
    document.getElementById("ipAddress").innerText =
      "Unable to retrieve IP address"
  }
}

// Function to convert timestamp from the database to a readable format
const convertToReadableDate = (timestamp) => {
  const date = new Date(timestamp)
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
  return `${day} ${month} ${year}, ${formattedHours}:${formattedMinutes}`
}

const urlify = (text) => {
  var urlRegex = /(?<!<a href=")(https?:\/\/[^\s]+)(?![^<]*<\/a>)/g
  return text.replace(urlRegex, function (url) {
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      url = "https://" + url
    }
    return `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`
  })
}

const showToolbar = () => {
  const selection = window.getSelection()

  if (selection.toString().length > 0) {
    chatTextInputToolbar.style.left = `calc(${
      selection.getRangeAt(0).getBoundingClientRect().left -
      chatTextInput.getBoundingClientRect().left
    }px + 20px)`

    chatTextInputToolbar.style.opacity = "1"
    chatTextInputToolbar.style.pointerEvents = "all"
    chatTextInputToolbar.style.userSelect = "all"
  } else {
    chatTextInputToolbar.style.opacity = "0"
    chatTextInputToolbar.style.pointerEvents = "none"
    chatTextInputToolbar.style.userSelect = "none"
    chatTextInputToolbar.style.left = "0"
  }
}

function formatText(command) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let selectedText = selection.toString();
    let newHtml = null;

    switch (command) {
      case 'createLink':
        let url = prompt("Enter the URL:");
        if (url) {
          newHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
        }
        break;
      case 'bold':
        newHtml = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        newHtml = `<em>${selectedText}</em>`;
        break;
      default:
        console.warn(`Unknown format command: ${command}`);
        return; // Don't do anything if the command is unknown
    }

    if (newHtml) {
      // Replace selected text with formatted text
      document.execCommand('insertHTML', false, newHtml); 
    }
  }
}

const autoDetectAndFormatLinks = (element) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const selection = window.getSelection()
  let range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  const textNodes = []
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )
  let node
  while ((node = walker.nextNode())) {
    textNodes.push(node)
  }

  textNodes.forEach((node) => {
    const text = node.nodeValue
    if (urlRegex.test(text)) {
      const newHTML = text.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank">${url}</a>`
      })

      const tempElement = document.createElement("div")
      tempElement.innerHTML = newHTML

      while (tempElement.firstChild) {
        node.parentNode.insertBefore(tempElement.firstChild, node)
      }
      node.parentNode.removeChild(node)

      if (range) {
        const newRange = document.createRange()
        newRange.setStart(range.startContainer, range.startOffset)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }
  })
}

//////////////////
//// Requests ////
//////////////////

// Function to create a new session
const createSession = async (userIPaddress) => {
  try {
    const response = await fetch(`${API_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIPaddress }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create session")
    }
    return await response.json()
  } catch (error) {
    console.error("Error creating session:", error)
    throw error // Re-throw the error to be handled by the caller
  }
}

// Function to send a message
const sendMessage = async (sessionId, sender, text) => {
  try {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: sender }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send message")
    }

    socket.emit("sendMessage", { sessionId, sender, text })
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

// Function to get session data
const getSession = async (userIPaddress) => {
  try {
    const response = await fetch(
      `${API_URL}/sessions?userIPaddress=${userIPaddress}`
    )
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to get session")
    }
    return await response.json()
  } catch (error) {
    return []
  }
}

///////////////
//// Fonts ////
///////////////

const fontPreconnectGoogleApis = document.createElement("link")
fontPreconnectGoogleApis.rel = "preconnect"
fontPreconnectGoogleApis.href = "https://fonts.googleapis.com"
document.head.appendChild(fontPreconnectGoogleApis)

const fontPreconnectGoogleStatic = document.createElement("link")
fontPreconnectGoogleStatic.rel = "preconnect"
fontPreconnectGoogleStatic.href = "https://fonts.gstatic.com"
fontPreconnectGoogleStatic.crossOrigin = true
document.head.appendChild(fontPreconnectGoogleStatic)

const fontGoogleCDN = document.createElement("link")
fontGoogleCDN.rel = "stylesheet"
fontGoogleCDN.href =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
document.head.appendChild(fontGoogleCDN)

//////////////////////
//// UI Functions ////
//////////////////////

const hideChat = () => {
  chatWrapper.classList.remove("chatWrapperShow")
}

const toggleChat = () => {
  chatWrapper.classList.toggle("chatWrapperShow")
}

const createMessage = ({ from, text }) => {
  const message = document.createElement("div")
  message.classList.add("chatMessage")
  const span = document.createElement("span")
  span.innerHTML = urlify(text)
  message.appendChild(span)

  if (from === CURRENT_USER_IP) message.classList.add("chatMessageFrom")

  chatBody.appendChild(message)
}

const handleSendMessage = async () => {
  const text = chatTextInput.innerHTML

  if (text.trim() !== "") {
    createMessage({ from: CURRENT_USER_IP, text })
    chatTextInput.innerHTML = ""
    chatBody.scrollTop = chatBody.scrollHeight
    chatWrapper.classList.remove("has-value")

    try {
      await sendMessage(CURRENT_SESSION_ID, CURRENT_USER_IP, text)
    } catch (error) {
      console.error("Error sending message:", error)
    }
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
floatingButton.innerHTML = `<svg width="157" height="133" viewBox="0 0 157 133" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M89.5 0H47C21.0426 0 0 21.0426 0 47C0 65.1293 10.2645 80.8611 25.299 88.701C33.1389 103.735 48.8707 114 67 114H88L124.75 132.5V111.471C143.222 105.138 156.5 87.6195 156.5 67C156.5 48.8707 146.235 33.1389 131.201 25.299C123.361 10.2645 107.629 0 89.5 0ZM47 10C26.5655 10 10 26.5655 10 47C10 56.9601 13.9356 66.0011 20.3364 72.6526C27.0678 79.6476 36.5256 84 47 84H68.25L105 102.5V80.6067C117.693 74.7429 126.5 61.9 126.5 47C126.5 36.5256 122.148 27.0678 115.153 20.3364C108.501 13.9356 99.4602 10 89.5 10H47Z" fill="white"/></svg>`
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

const chatTextInput = document.createElement("div")
chatTextInput.id = "chatTextInput"
chatTextInput.setAttribute("contenteditable", true)
chatTextInput.setAttribute("data-placeholder", "Send a message...")
chatTextInputWrapper.appendChild(chatTextInput)

const chatTextInputToolbar = document.createElement("div")
chatTextInputToolbar.id = "chatTextInputToolbar"
chatTextInputWrapper.appendChild(chatTextInputToolbar)

// Bold button
const chatTextInputToolbarBoldButton = document.createElement("button")
chatTextInputToolbarBoldButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M6.8 19V5h5.525q1.625 0 3 1T16.7 8.775q0 1.275-.575 1.963t-1.075.987q.625.275 1.388 1.025T17.2 15q0 2.225-1.625 3.113t-3.05.887zm3.025-2.8h2.6q1.2 0 1.463-.612t.262-.888t-.262-.887t-1.538-.613H9.825zm0-5.7h2.325q.825 0 1.2-.425t.375-.95q0-.6-.425-.975t-1.1-.375H9.825z"/></svg>`
chatTextInputToolbarBoldButton.addEventListener("click", () =>
  formatText("bold")
)
chatTextInputToolbar.appendChild(chatTextInputToolbarBoldButton)

// Italic button
const chatTextInputToolbarItalicButton = document.createElement("button")
chatTextInputToolbarItalicButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M5 19v-2.5h4l3-9H8V5h10v2.5h-3.5l-3 9H15V19z"/></svg>`
chatTextInputToolbarItalicButton.addEventListener("click", () =>
  formatText("italic")
)
chatTextInputToolbar.appendChild(chatTextInputToolbarItalicButton)

// Link button
const chatTextInputToolbarCreateLinkButton = document.createElement("button")
chatTextInputToolbarCreateLinkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M8.25 18q-2.6 0-4.425-1.825T2 11.75t1.825-4.425T8.25 5.5h9.25q1.875 0 3.188 1.313T22 10t-1.312 3.188T17.5 14.5H8.75q-1.15 0-1.95-.8T6 11.75t.8-1.95T8.75 9H18v2H8.75q-.325 0-.537.213T8 11.75t.213.538t.537.212h8.75q1.05-.025 1.775-.737T20 10t-.725-1.775T17.5 7.5H8.25q-1.775-.025-3.012 1.225T4 11.75q0 1.75 1.238 2.975T8.25 16H18v2z"/></svg>`
chatTextInputToolbarCreateLinkButton.addEventListener("click", () =>
  formatText("createLink")
)
chatTextInputToolbar.appendChild(chatTextInputToolbarCreateLinkButton)

const chatSendButton = document.createElement("button")
chatSendButton.id = "chatSendButton"
chatSendButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M3.402 6.673c-.26-2.334 2.143-4.048 4.266-3.042l11.944 5.658c2.288 1.083 2.288 4.339 0 5.422L7.668 20.37c-2.123 1.006-4.525-.708-4.266-3.042L3.882 13H12a1 1 0 1 0 0-2H3.883z" clip-rule="evenodd"/></svg>`
chatTextInputWrapper.appendChild(chatSendButton)

const chatCreditText = document.createElement("a")
chatCreditText.id = "chatCreditText"
chatCreditText.setAttribute(
  "href",
  "https://liveweb.chat/&ref=" + window.location.hostname
)
chatCreditText.setAttribute("target", "_blank")
chatCreditText.innerHTML = `<svg width="69" height="15" viewBox="0 0 69 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.18421 1.31579C3.49546 1.31579 1.31579 3.49546 1.31579 6.18421C1.31579 7.49476 1.83363 8.68436 2.67585 9.55956C3.56155 10.4799 4.806 11.0526 6.18421 11.0526H59.6053C62.294 11.0526 64.4737 8.87297 64.4737 6.18421C64.4737 4.806 63.901 3.56155 62.9806 2.67585C62.1054 1.83363 60.9158 1.31579 59.6053 1.31579H6.18421Z" fill="currentColor"/><path d="M1.31579 6.18421C1.31579 3.49546 3.49546 1.31579 6.18421 1.31579H59.6053C60.9158 1.31579 62.1054 1.83363 62.9806 2.67585C63.901 3.56155 64.4737 4.806 64.4737 6.18421C64.4737 8.87297 62.294 11.0526 59.6053 11.0526H6.18421C4.806 11.0526 3.56155 10.4799 2.67585 9.55956C1.83363 8.68436 1.31579 7.49476 1.31579 6.18421Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M62.2368 15C65.6523 15 68.421 12.2312 68.421 8.81579C68.421 6.43036 67.0705 4.36038 65.0922 3.32881C64.0607 1.3506 61.9907 0 59.6053 0H6.18421C2.76877 0 0 2.76877 0 6.18421C0 8.56964 1.3506 10.6396 3.32881 11.6712C4.36038 13.6494 6.43036 15 8.81579 15H62.2368ZM6.18421 1.31579C3.49546 1.31579 1.31579 3.49546 1.31579 6.18421C1.31579 7.49476 1.83363 8.68436 2.67585 9.55956C3.56155 10.4799 4.806 11.0526 6.18421 11.0526H59.6053C62.294 11.0526 64.4737 8.87297 64.4737 6.18421C64.4737 4.806 63.901 3.56155 62.9806 2.67585C62.1054 1.83363 60.9158 1.31579 59.6053 1.31579H6.18421Z" fill="currentColor"/><path d="M4.86842 3.4H5.91053V7.93158H8.42105V8.92632H4.86842V3.4Z" fill="currentColor"/><path d="M9.62346 3.4H13.3182V4.39474H11.9919V7.93158H13.3182V8.92632H9.62346V7.93158H10.9498V4.39474H9.62346V3.4Z" fill="currentColor"/><path d="M14.0785 3.4H15.1522L16.2338 8.40526H16.3759L17.4574 3.4H18.5311L17.2838 8.92632H15.3259L14.0785 3.4Z" fill="currentColor"/><path d="M19.3704 3.4H22.8598V4.39474H20.4125V5.65789H22.7651V6.65263H20.4125V7.93158H22.9546V8.92632H19.3704V3.4Z" fill="currentColor"/><path d="M30.0695 8.92632H28.2537L28.0011 4.72632V3.96842H27.8116V4.72632L27.559 8.92632H25.7432L25.5537 3.4H26.5011L26.6274 7.6V8.31053H26.8169V7.6L27.0695 3.4H28.7432L28.9958 7.6V8.31053H29.1853V7.6L29.3116 3.4H30.259L30.0695 8.92632Z" fill="currentColor"/><path d="M30.9719 3.4H34.4614V4.39474H32.014V5.65789H34.3667V6.65263H32.014V7.93158H34.5561V8.92632H30.9719V3.4Z" fill="currentColor"/><path d="M35.5217 7.93158H36.0428V4.39474H35.5217V3.4H37.9454C38.2086 3.4 38.4401 3.43684 38.6401 3.51053C38.8454 3.58421 39.0164 3.68421 39.1533 3.81053C39.2954 3.93684 39.4007 4.08947 39.4691 4.26842C39.5428 4.44211 39.5796 4.63158 39.5796 4.83684V4.93158C39.5796 5.24737 39.4901 5.5 39.3112 5.68947C39.1375 5.87895 38.9164 6.01053 38.648 6.08421V6.22632C38.9164 6.3 39.1375 6.43421 39.3112 6.62895C39.4901 6.81842 39.5796 7.07105 39.5796 7.38684V7.48158C39.5796 7.68684 39.5428 7.87895 39.4691 8.0579C39.4007 8.23158 39.2954 8.38421 39.1533 8.51579C39.0164 8.64211 38.8454 8.74211 38.6401 8.81579C38.4401 8.88947 38.2086 8.92632 37.9454 8.92632H35.5217V7.93158ZM37.0849 7.93158H37.8428C38.0638 7.93158 38.2428 7.88421 38.3796 7.78947C38.5164 7.69474 38.5849 7.53684 38.5849 7.31579V7.26842C38.5849 7.04737 38.5164 6.88947 38.3796 6.79474C38.2428 6.7 38.0638 6.65263 37.8428 6.65263H37.0849V7.93158ZM37.0849 5.65789H37.8428C38.0638 5.65789 38.2428 5.61316 38.3796 5.52368C38.5164 5.42895 38.5849 5.27105 38.5849 5.05V5.00263C38.5849 4.78158 38.5164 4.62632 38.3796 4.53684C38.2428 4.44211 38.0638 4.39474 37.8428 4.39474H37.0849V5.65789Z" fill="currentColor"/><path d="M44.3577 8.08947C44.5577 8.08947 44.7209 8.06053 44.8472 8.00263C44.9788 7.93947 45.0788 7.8579 45.1472 7.7579C45.2209 7.65263 45.2709 7.53421 45.2972 7.40263C45.3235 7.26579 45.3367 7.12632 45.3367 6.98421V6.84211H46.3788V6.98421C46.3788 7.64211 46.2051 8.15 45.8577 8.5079C45.5156 8.86053 45.0156 9.03684 44.3577 9.03684C43.7261 9.03684 43.2261 8.84474 42.8577 8.46053C42.4893 8.07632 42.3051 7.51579 42.3051 6.77895V5.54737C42.3051 5.19474 42.3524 4.87895 42.4472 4.6C42.5419 4.31579 42.6788 4.07895 42.8577 3.88947C43.0367 3.69474 43.2524 3.54737 43.5051 3.44737C43.7577 3.34211 44.0419 3.28947 44.3577 3.28947C44.684 3.28947 44.9735 3.33684 45.2261 3.43158C45.4788 3.52632 45.6893 3.66316 45.8577 3.84211C46.0314 4.02105 46.1603 4.23684 46.2445 4.48947C46.334 4.74211 46.3788 5.02632 46.3788 5.34211V5.48421H45.3367V5.34211C45.3367 5.21053 45.3209 5.07895 45.2893 4.94737C45.2577 4.81579 45.2051 4.69737 45.1314 4.59211C45.0577 4.48684 44.9577 4.40263 44.8314 4.33947C44.7051 4.27105 44.5472 4.23684 44.3577 4.23684C44.184 4.23684 44.034 4.27105 43.9077 4.33947C43.7814 4.40263 43.6761 4.49211 43.5919 4.60789C43.5077 4.71842 43.4445 4.85 43.4024 5.00263C43.3656 5.15 43.3472 5.30526 43.3472 5.46842V6.8579C43.3472 7.03684 43.3656 7.20263 43.4024 7.35526C43.4393 7.50263 43.4972 7.63158 43.5761 7.74211C43.6551 7.85263 43.7577 7.93947 43.884 8.00263C44.0156 8.06053 44.1735 8.08947 44.3577 8.08947Z" fill="currentColor"/><path d="M47.2417 3.4H48.2838V5.65789H50.068V3.4H51.1101V8.92632H50.068V6.65263H48.2838V8.92632H47.2417V3.4Z" fill="currentColor"/><path d="M54.9494 7.74211H53.0704L52.802 8.92632H51.7125L53.0309 3.4H54.9888L56.3073 8.92632H55.2178L54.9494 7.74211ZM53.2915 6.74737H54.7204L54.0809 3.92105H53.9388L53.2915 6.74737Z" fill="currentColor"/><path d="M56.8544 3.4H60.8333V4.39474H59.3649V8.92632H58.3228V4.39474H56.8544V3.4Z" fill="currentColor"/></svg>`
chatBottomWrapper.appendChild(chatCreditText)

/////////////////////////
//// Event Listeners ////
/////////////////////////

let urlTypingTimeout

floatingButton.addEventListener("click", () => toggleChat())

chatTextInput.addEventListener("keyup", (e) => {
  clearTimeout(urlTypingTimeout)

  urlTypingTimeout = setTimeout(() => {
    autoDetectAndFormatLinks(e.target)
  }, 500)

  if (e.target.innerHTML.trim()) {
    chatWrapper.classList.add("has-value")
  } else {
    chatWrapper.classList.remove("has-value")
  }
})

chatTextInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "k") {
    e.preventDefault()
    formatText("createLink")
  }
  if (e.ctrlKey && e.key === "i") {
    e.preventDefault()
    formatText("italic")
  }
  if (e.ctrlKey && e.key === "b") {
    e.preventDefault()
    formatText("bold")
  }
})

chatTextInput.addEventListener("input", () => {
  if (chatTextInput.innerHTML === "<br>" || chatTextInput.innerHTML === "") {
    chatTextInput.innerHTML = ""
  }

  if (chatTextInput.textContent.trim()) {
    chatWrapper.classList.add("has-value")
  } else {
    chatWrapper.classList.remove("has-value")
  }
})

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection()

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const selectedNode = range.commonAncestorContainer

    if (
      chatTextInput.contains(selectedNode) &&
      selection.toString().length > 0
    ) {
      chatTextInputToolbar.style.left = `calc(${
        range.getBoundingClientRect().left -
        chatTextInput.getBoundingClientRect().left
      }px + 20px)`

      chatTextInputToolbar.style.opacity = "1"
      chatTextInputToolbar.style.pointerEvents = "all"
      chatTextInputToolbar.style.userSelect = "all"
    } else {
      chatTextInputToolbar.style.opacity = "0"
      chatTextInputToolbar.style.pointerEvents = "none"
      chatTextInputToolbar.style.userSelect = "none"
      chatTextInputToolbar.style.left = "0"
    }
  }
})

chatTextInput.addEventListener("mouseup", showToolbar)
chatTextInput.addEventListener("focus", showToolbar)

chatSendButton.addEventListener("click", handleSendMessage)
chatTextInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
})

// Initialize App

// Function to update the UI based on session data
const updateUI = (sessionData) => {
  if (sessionData) {
    chatBody.innerHTML = ""

    if (sessionData.remote && sessionData.remote.connected) {
      chatConnectingIcon.style.display = "none"
      chatConnectedIcon.style.display = "flex"
      chatHeaderStatusText.innerHTML = `${sessionData.remote.name}<span id="chatHeaderStatusAvailable">Available</span>`
    } else {
      chatConnectingIcon.style.display = "flex"
      chatConnectedIcon.style.display = "none"
      chatHeaderStatusText.innerHTML = "Connecting you to a specialist..."
    }

    if (!sessionData.messages || !sessionData.messages.length) {
      chatBody.appendChild(chatNoMessages)
    } else {
      sessionData.messages.forEach((message) => {
        createMessage({
          from: message.sender,
          text: message.text,
        })
      })

      const lastActiveFormattedDate = convertToReadableDate(
        sessionData.lastActive
      )
      chatBody.innerHTML += `<span id="chatLastMessageTime">${lastActiveFormattedDate}</span>`
      chatBody.scrollTop = chatBody.scrollHeight
    }
  }
}

async function initializeSession() {
  chatBody.appendChild(chatInitializingLoader)

  try {
    CURRENT_USER_IP = await getUserIP()
    let session = await getSession(CURRENT_USER_IP)

    if (session && session.active) {
      CURRENT_SESSION_ID = session.id
    } else {
      const newSession = await createSession(CURRENT_USER_IP)
      CURRENT_SESSION_ID = newSession.id
      session = await getSession(CURRENT_USER_IP)
    }

    // Join the Socket.IO session room using the session ID
    socket.emit("joinSession", CURRENT_SESSION_ID)

    // Update the UI with the initial session data
    updateUI(session)
  } catch (error) {
    console.error("Error initializing session:", error)
  } finally {
    chatBody.removeChild(chatInitializingLoader)
  }
}

socket.on("connect", () => {
  console.log("Connected to server via Socket.IO")

  socket.on("newMessage", (message) => {
    console.log("New message received:", message)
    createMessage({
      from: message.sender,
      text: message.text,
    })
  })

  socket.on("sessionUpdated", async () => {
    console.log("Session updated event received")
    try {
      const updatedSession = await getSession(CURRENT_USER_IP)
      updateUI(updatedSession)
    } catch (error) {
      console.error("Error fetching updated session:", error)
    }
  })
})

initializeSession()
