import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react"
import clsx from "clsx"

import { Message, Session } from "../../../app/modules/chat/core/_models"

import { doc, onSnapshot } from "firebase/firestore"
import { firestore } from "../../../firebaseconfig"
import { sendMessage } from "../../../app/modules/chat/core/_requests"
import { convertTimestampToReadableOnlyHour } from "../../../app/modules/chat/core/_helpers"

type Props = {
  currentSession: Session
  setCurrentSession?: Dispatch<SetStateAction<Session | undefined>>
}

const ChatInner: FC<Props> = ({ currentSession }) => {
  const chatBody = useRef<HTMLDivElement | null>(null)

  const [message, setMessage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])

  const goBottom = () => {
    setTimeout(() => {
      if (chatBody.current) {
        chatBody.current.scrollTop = chatBody.current.scrollHeight
      }
    }, 100)
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      const newMessage: Message = {
        id: new Date().getTime().toString(),
        sender: "admin",
        text: message,
        sending: true,
        read: false,
      }

      setMessages((prevMessages) => [...(prevMessages || []), newMessage])
      setMessage("")
      goBottom()

      await sendMessage(currentSession.id, "admin", message)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  useEffect(() => {
    if (currentSession.messages) {
      setMessages(currentSession.messages || [])
    }

    const sessionRef = doc(firestore, "sessions", currentSession.id)

    const unsubscribe = onSnapshot(
      sessionRef,
      (doc) => {
        if (doc.exists()) {
          const sessionData = doc.data()
          setMessages(sessionData.messages || [])
          goBottom()
        }
      },
      (error) => {
        console.error("Error fetching messages: ", error)
      }
    )

    return () => unsubscribe()
  }, [currentSession])

  const onEnterPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div
      className="card-body"
      id="kt_chat_messenger_body"
      style={{ paddingTop: 0 }}
    >
      <div
        ref={chatBody}
        className="scroll-y me-n5 pe-5 h-300px h-lg-auto"
        data-kt-element="messages"
        data-kt-scroll="true"
        data-kt-scroll-activate="{default: false, lg: true}"
        data-kt-scroll-max-height="auto"
        data-kt-scroll-dependencies="#kt_header, #kt_app_header, #kt_app_toolbar, #kt_toolbar, #kt_footer, #kt_app_footer, #kt_chat_messenger_header, #kt_chat_messenger_footer"
        data-kt-scroll-wrappers="#kt_content, #kt_app_content, #kt_chat_messenger_body"
        data-kt-scroll-offset="5px"
        style={{
          maxHeight: 400,
          overflowY: "auto",
          padding: 10,
          scrollBehavior: "smooth",
        }}
      >
        {messages
          ? messages.map((message, index) => {
              const state =
                message.sender === currentSession.userIPaddress
                  ? "info"
                  : "primary"
              const fromCustomer =
                message.sender === currentSession.userIPaddress

              return (
                <div
                  key={`message${index}`}
                  className={clsx("d-flex mt-10 position-relative")}
                >
                  <div
                    className={clsx(
                      "w-100 d-flex flex-column align-items",
                      `align-items-${fromCustomer ? "start" : "end"}`
                    )}
                  >
                    <div className="d-flex align-items-center mb-2">
                      {fromCustomer ? (
                        <div className="d-flex align-items-end gap-1">
                          <span className="fs-5 fw-bold text-gray-900 me-1">
                            {message.sender}
                          </span>
                          <span className="text-muted fs-8">
                            {convertTimestampToReadableOnlyHour(
                              Number(message.id)
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-end gap-1">
                          <span className="text-muted fs-8">
                            {convertTimestampToReadableOnlyHour(
                              Number(message.id)
                            )}
                          </span>
                          <span className="fs-5 fw-bold text-gray-900 ms-1">
                            You
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={clsx(
                        "p-5 rounded",
                        `bg-light-${state}`,
                        "text-gray-900 fw-semibold mw-lg-400px",
                        `text-start`
                      )}
                      data-kt-element="message-text"
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    ></div>
                  </div>
                  {message.sending && <SendingIcon />}
                </div>
              )
            })
          : ""}
      </div>

      <div className="card-footer pt-4" id="kt_chat_messenger_footer">
        {currentSession.remote.connected ? (
          <>
            {" "}
            <textarea
              className="form-control form-control-flush mb-3"
              rows={1}
              data-kt-element="input"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={onEnterPress}
            ></textarea>
            <div className="d-flex flex-stack">
              <div className="d-flex align-items-center me-2">
                <button
                  className="btn btn-sm btn-icon btn-active-light-primary me-1"
                  type="button"
                  data-bs-toggle="tooltip"
                  title="Coming soon"
                >
                  <i className="bi bi-paperclip fs-3"></i>
                </button>
                <button
                  className="btn btn-sm btn-icon btn-active-light-primary me-1"
                  type="button"
                  data-bs-toggle="tooltip"
                  title="Coming soon"
                >
                  <i className="bi bi-upload fs-3"></i>
                </button>
              </div>
              <button
                className="btn btn-primary"
                type="button"
                data-kt-element="send"
                onClick={handleSendMessage}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="d-flex justify-content-center align-items-center py-5">
            <span className="text-center text-gray-600 fs-6 fw-bold">
              Connect first to reply.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const SendingIcon = () => (
  <svg
    className="text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    style={{ marginTop: "auto", marginLeft: 7 }}
  >
    <path
      fill="currentColor"
      d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"
    />
    <rect width="2" height="7" x="11" y="6" fill="currentColor" rx="1">
      <animateTransform
        attributeName="transform"
        dur="9s"
        repeatCount="indefinite"
        type="rotate"
        values="0 12 12;360 12 12"
      />
    </rect>
    <rect width="2" height="9" x="11" y="11" fill="currentColor" rx="1">
      <animateTransform
        attributeName="transform"
        dur="0.75s"
        repeatCount="indefinite"
        type="rotate"
        values="0 12 12;360 12 12"
      />
    </rect>
  </svg>
)

export { ChatInner }
