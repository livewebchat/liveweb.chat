export interface Message {
  id: string
  sender: string
  text: string
  sending: boolean
  read: boolean
}

export interface Session {
  id: string
  active: boolean
  createdAt: Date
  domain: string
  lastActive: Date
  messages: Message[]
  userIPaddress: string
  remote: {
    connected: boolean
    name?: string
  }
}
