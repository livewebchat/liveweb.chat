import { Route, Routes, Outlet } from "react-router-dom"
import { PageLink, PageTitle } from "../../../_metronic/layout/core"
import { Chat } from "./components/Chat"

const chatBreadCrumbs: Array<PageLink> = [
  {
    title: "Chat",
    path: "/chat",
    isSeparator: false,
    isActive: false,
  },
  {
    title: "",
    path: "",
    isSeparator: true,
    isActive: false,
  },
]

const ChatPage = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          index
          element={
            <>
              <PageTitle breadcrumbs={chatBreadCrumbs}>Chats</PageTitle>
              <Chat />
            </>
          }
        />
      </Route>
    </Routes>
  )
}

export default ChatPage
