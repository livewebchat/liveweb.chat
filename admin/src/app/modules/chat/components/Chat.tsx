import { FC, useEffect, useState } from "react"
import { Session } from "../core/_models"
import { io } from "socket.io-client"

import { KTIcon } from "../../../../_metronic/helpers"
import { ChatInner } from "../../../../_metronic/partials"
import { Content } from "../../../../_metronic/layout/components/Content"

import { ChatSidebarSkeleton } from "./ChatSidebarSkeleton"
import { ChatSkeleton } from "./ChatSkeleton"

import { SessionItem } from "./SessionItem"

import {
  setRemoteConnectedBySessionId,
  setRemoteDisonnectedBySessionId,
} from "../core/_requests"

import { useAuth } from "../../auth"

// Initialize socket connection (adjust URL as necessary)
const socket = io("http://localhost:3000")

const Chat: FC = () => {
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | undefined>()
  const { currentUser } = useAuth()

  // Fetch sessions from server via Socket.IO
  useEffect(() => {
    socket.emit("fetchSessions")

    // Listen for sessions data
    socket.on("sessionsData", (sessionsData: Session[]) => {
      setSessions(sessionsData)
      setSessionsLoading(false)
    })

    // Real-time update for individual sessions
    socket.on("sessionUpdated", (updatedSession: Session) => {
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === updatedSession.id ? updatedSession : session
        )
      )
    })

    return () => {
      socket.off("sessionsData")
      socket.off("sessionUpdated")
    }
  }, [])

  // Update current session based on real-time session updates
  useEffect(() => {
    if (currentSession) {
      const updatedSession = sessions.find(
        (session) => session.id === currentSession.id
      )
      setCurrentSession(updatedSession)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions])

  // Handle session connect and disconnect via Socket.IO
  const handleSessionConnect = (sessionId: string) => {
    socket.emit("connectToSession", {
      sessionId,
      agentName: currentUser?.fullname ?? "Support Agent",
    })
  }

  const handleSessionDisconnect = (sessionId: string) => {
    socket.emit("disconnectFromSession", sessionId)
  }

  return (
    <>
      <Content>
        <div className="d-flex flex-column flex-lg-row py-10">
          {sessionsLoading ? (
            <>
              <ChatSidebarSkeleton />
              <ChatSkeleton />
            </>
          ) : sessions.length ? (
            <>
              <div className="flex-column flex-lg-row-auto w-100 w-lg-300px w-xl-400px mb-10 mb-lg-0">
                <div className="card card-flush">
                  <div
                    className="card-header pt-7"
                    id="kt_chat_contacts_header"
                  >
                    <div className="w-100 position-relative">
                      <KTIcon
                        iconName="magnifier"
                        className="fs-2 text-lg-1 text-gray-500 position-absolute top-50 ms-5 translate-middle-y"
                      />

                      <input
                        type="text"
                        className="form-control form-control-solid px-15"
                        name="search"
                        placeholder="Search"
                      />
                    </div>
                  </div>

                  <div className="card-body pt-5" id="kt_chat_contacts_body">
                    <div
                      className="scroll-y me-n5 pe-5 h-200px h-lg-auto"
                      data-kt-scroll="true"
                      data-kt-scroll-activate="{default: false, lg: true}"
                      data-kt-scroll-max-height="auto"
                      data-kt-scroll-dependencies="#kt_header, #kt_toolbar, #kt_footer, #kt_chat_contacts_header"
                      data-kt-scroll-wrappers="#kt_content, #kt_chat_contacts_body"
                      data-kt-scroll-offset="0px"
                    >
                      {sessions.map((session) => (
                        <SessionItem
                          session={session}
                          setCurrentSession={setCurrentSession}
                          key={session.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-lg-row-fluid ms-lg-7 ms-xl-10">
                {currentSession ? (
                  <div className="card" id="kt_chat_messenger">
                    <div className="card-header" id="kt_chat_messenger_header">
                      <div className="card-title">
                        <div className="symbol-group symbol-hover"></div>
                        <div className="d-flex justify-content-center flex-column me-3">
                          <div className="fs-4 fw-bolder text-gray-900 me-1 py-4 lh-1">
                            <SessionItem session={currentSession} header />

                            <span
                              className={`badge badge-${
                                currentSession.active ? "success" : "danger"
                              } badge-circle w-10px h-10px me-1`}
                            ></span>
                            <span className="fs-7 fw-bold text-gray-500">
                              {currentSession.active
                                ? "Active"
                                : "Not available"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center">
                        {currentSession.remote?.connected ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleSessionDisconnect(currentSession.id)
                            }
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() =>
                              handleSessionConnect(currentSession.id)
                            }
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>

                    <ChatInner currentSession={currentSession} />
                  </div>
                ) : (
                  <div className="card">
                    <div className="card-body min-h-500px d-flex justify-content-center align-items-center">
                      <span className="text-gray-600 fs-6 fw-bold">
                        Choose a chat and start talking to people!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex-column flex-lg-row-auto w-100 w-lg-300px w-xl-400px mb-10 mb-lg-0">
                <div className="card card-flush">
                  <div
                    className="card-header pt-7"
                    id="kt_chat_contacts_header"
                  >
                    <div className="w-100 position-relative">
                      <KTIcon
                        iconName="magnifier"
                        className="fs-2 text-lg-1 text-gray-500 position-absolute top-50 ms-5 translate-middle-y"
                      />

                      <input
                        type="text"
                        className="form-control form-control-solid px-15"
                        name="search"
                        placeholder="Search"
                      />
                    </div>
                  </div>

                  <div className="card-body pt-5" id="kt_chat_contacts_body">
                    <div
                      className="scroll-y me-n5 pe-5 h-200px h-lg-auto"
                      data-kt-scroll="true"
                      data-kt-scroll-activate="{default: false, lg: true}"
                      data-kt-scroll-max-height="auto"
                      data-kt-scroll-dependencies="#kt_header, #kt_toolbar, #kt_footer, #kt_chat_contacts_header"
                      data-kt-scroll-wrappers="#kt_content, #kt_chat_contacts_body"
                      data-kt-scroll-offset="0px"
                    >
                      {sessions.map((session) => (
                        <SessionItem
                          session={session}
                          setCurrentSession={setCurrentSession}
                          key={session.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-lg-row-fluid ms-lg-7 ms-xl-10">
                <div className="card">
                  <div className="card-body min-h-500px d-flex flex-column justify-content-center align-items-center">
                    <span className="text-gray-700 fs-3 fw-bold">
                      No session found!
                    </span>
                    <span className="text-gray-600 fs-6 fw-bold mt-2">
                      Wait for your users to text you.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Content>
    </>
  )
}

export { Chat }
