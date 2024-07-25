import ReactCountryFlag from "react-country-flag"
import {
  convertFirestoreTimestampToReadable,
  ip2Location,
} from "../core/_helpers"
import { Session } from "../core/_models"
import { Dispatch, SetStateAction, useEffect, useState } from "react"

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
  const [countryCode, setCountryCode] = useState()

  useEffect(() => {
    const fetchCountryCode = async () => {
      if (session && session.userIPaddress) {
        setCountryCode(await ip2Location(session.userIPaddress))
      }
    }

    fetchCountryCode()
  }, [session])

  return (
    <a
      className={`session-item d-flex flex-stack text-gray-900 rounded${
        header ? "" : " cursor-pointer bg-hover-gray-100 p-4"
      }`}
      key={session.id}
      onClick={() => setCurrentSession && setCurrentSession(session)}
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
            </span>
          </div>
          {!header && (
            <div className="fw-bold text-gray-500">
              {convertFirestoreTimestampToReadable(session.lastActive)}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}
