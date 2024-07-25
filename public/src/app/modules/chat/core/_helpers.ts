import { Timestamp } from "firebase/firestore"

export const convertFirestoreTimestamp = (timestamp: Timestamp) => {
  const date = new Date(timestamp.seconds * 1000)
  return date.toLocaleString()
}

export const convertFirestoreTimestampToReadable = (timestamp: Timestamp) => {
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

export const convertTimestampToReadable = (timestamp: number) => {
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
  const formattedDate = `${day} ${month} ${year}, ${formattedHours}:${formattedMinutes}`
  return formattedDate
}

export const convertTimestampToReadableOnlyHour = (timestamp: number) => {
  const now = new Date()
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
  const formattedDate = `${day} ${month} ${year}, ${formattedHours}:${formattedMinutes}`
  const formattedHour = `${formattedHours}:${formattedMinutes}`

  const isToday =
    now.getUTCFullYear() === date.getUTCFullYear() &&
    now.getUTCMonth() === date.getUTCMonth() &&
    now.getUTCDate() === date.getUTCDate()

  if (isToday) {
    return formattedDate
  } else {
    return formattedHour
  }
}

export const timeAgo = (timestamp: number): string => {
  const now = Date.now()
  const diffInSeconds = Math.floor((now - timestamp) / 1000)

  const seconds = Math.floor(diffInSeconds % 60)
  const minutes = Math.floor((diffInSeconds / 60) % 60)
  const hours = Math.floor((diffInSeconds / 3600) % 24)
  const days = Math.floor(diffInSeconds / 86400)

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (seconds > 0) {
    return `${seconds} second${seconds > 1 ? "s" : ""} ago`
  } else {
    return "just now"
  }
}

export const getUserIP = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json")
    const data = await response.json()

    return data.ip
  } catch (error) {
    console.error("Error fetching IP address:", error)
  }
}

export const urlify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, function (url: string) {
    return `<a href="${url}" target="blank">${url}</a>`
  })
}

export const ip2Location = async (ip: string) => {
  try {
    const response = await fetch(`https://api.iplocation.net/?ip=${ip}`)

    if (!response.ok) {
      throw new Error("Network response was not ok")
    }

    const data = await response.json()
    return data["country_code2"]
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error)
  }
}
