// import ReactCountryFlag from "react-country-flag"
import { ip2Location } from "../core/_helpers"
import { Session } from "../core/_models"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { useAuth } from "../../auth"
import { io } from "socket.io-client"
import { ReactCountryFlag } from "react-country-flag"

const socket = io("https://localhost:3000")

interface Props {
  session: Session
  setCurrentSession?: Dispatch<SetStateAction<Session | undefined>>
  header?: boolean
}

export const SessionItem: React.FC<Props> = ({
  session,
  setCurrentSession,
  header,
}) => {
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    const fetchCountryCode = async () => {
      if (session && session.userIPaddress) {
        setCountryCode(await ip2Location(session.userIPaddress))
      }
    }

    fetchCountryCode()

    socket.emit("checkSessionConnection", session.id)

    socket.on("sessionConnectionStatus", ({ sessionId, connected }) => {
      if (sessionId === session.id) {
        setIsConnected(connected)
      }
    })

    return () => {
      socket.off("sessionConnectionStatus")
    }
  }, [session])

  const handleSessionClick = () => {
    if (setCurrentSession) {
      setCurrentSession(session)
    }

    // Inform the server to join this session via Socket.IO
    socket.emit("joinSession", session.id)
  }

  return (
    <a
      className={`session-item d-flex flex-stack text-gray-900 rounded${
        header ? "" : " cursor-pointer bg-hover-gray-100 p-4 w-full"
      }`}
      key={session.id}
      onClick={handleSessionClick}
    >
      <div className="d-flex align-items-center">
        <div>
          <div className="d-flex align-items-center fs-5 fw-bolder mb-2">
            {countryCode ? (
              <ReactCountryFlag countryCode={countryCode} svg />
            ) : (
              <span style={{ width: 22 }}></span>
            )}
            <span className={`ms-2${header ? " fs-3" : ""}`}>
              {session.userIPaddress}
              {header && (
                <span className="text-gray-600 ms-2 fs-7 fw-normal">
                  {session.domain}
                </span>
              )}
            </span>
          </div>
          {!header && (
            <div className="fw-bold text-gray-500">
              {session.lastActive.toString()}
            </div>
          )}
        </div>
      </div>

      {/* Display session connection status (real-time via socket) */}
      {!header && (
        <div className="d-flex align-items-center">
          <span
            className={`badge ${
              isConnected ? "badge-success" : "badge-danger"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      )}
    </a>
  )
}
