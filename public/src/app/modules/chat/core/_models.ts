import { Timestamp } from "firebase/firestore"

export interface Message {
  id: string
  sender: string
  text: string
  sending: boolean
}

export interface Session {
  id: string
  active: boolean
  createdAt: Timestamp
  domain: string
  lastActive: Timestamp
  messages: Message[]
  userIPaddress: string
}
