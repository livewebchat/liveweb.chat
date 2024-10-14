import { FC, useEffect, useState } from "react"

import { Session } from "../core/_models"

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore"
import { firestore } from "../../../../firebaseconfig"

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

const Chat: FC = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session>()

  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchSessions = async () => {
      const sessionsCollectionRef = collection(firestore, "sessions")
      const q = query(sessionsCollectionRef, orderBy("createdAt", "desc"))

      // Get initial sessions
      const snapshot = await getDocs(q)
      const initialSessions: Session[] = []
      snapshot.forEach((doc) => {
        const {
          active,
          domain,
          userIPaddress,
          messages,
          lastActive,
          createdAt,
          remote,
        } = doc.data()
        const sessionData: Session = {
          id: doc.id,
          active,
          createdAt,
          domain,
          lastActive,
          messages,
          userIPaddress,
          remote,
        }
        initialSessions.push(sessionData)
      })
      setSessions(initialSessions)

      snapshot.forEach((doc) => {
        const sessionDocRef = doc.ref

        onSnapshot(sessionDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const updatedSessionData = {
              id: docSnapshot.id,
              active: docSnapshot.data().active,
              createdAt: docSnapshot.data().createdAt,
              domain: docSnapshot.data().domain,
              lastActive: docSnapshot.data().lastActive,
              messages: docSnapshot.data().messages,
              userIPaddress: docSnapshot.data().userIPaddress,
              remote: docSnapshot.data().remote,
            }

            setSessions((prevSessions) =>
              prevSessions.map((session) =>
                session.id === updatedSessionData.id
                  ? updatedSessionData
                  : session
              )
            )
          }
        })
      })
    }

    fetchSessions()
  }, [])

  useEffect(() => {
    if (currentSession)
      setCurrentSession(
        sessions.find((session) => session.id === currentSession.id)
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions])

  return (
    <>
      <Content>
        <div className="d-flex flex-column flex-lg-row py-10">
          {sessions ? (
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
                        <>
                          <SessionItem
                            session={session}
                            setCurrentSession={setCurrentSession}
                            key={session.id}
                          />
                        </>
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
                        {currentSession.remote.connected ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setRemoteDisonnectedBySessionId(currentSession.id)
                            }}
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setRemoteConnectedBySessionId(
                                currentSession.id,
                                currentUser?.fullname ?? "Support Agent"
                              )
                            }}
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
                        Choose a chat to start talking to people.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ChatSidebarSkeleton />
              <ChatSkeleton />
            </>
          )}
        </div>
      </Content>
    </>
  )
}

export { Chat }
