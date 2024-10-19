import { MenuItem } from "./MenuItem"
import { MenuInnerWithSub } from "./MenuInnerWithSub"
import { MegaMenu } from "./MegaMenu"
import { useIntl } from "react-intl"

export function MenuInner() {
  const intl = useIntl()
  return (
    <>
      <MenuItem
        title="Dashboard"
        to="/dashboard"
      />

      <MenuItem to="/chat" title="Chats" />
    </>
  )
}
