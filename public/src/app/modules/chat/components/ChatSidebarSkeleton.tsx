import { useThemeMode } from "../../../../_metronic/partials/layout/theme-mode/ThemeModeProvider"
export const ChatSidebarSkeleton = () => {
  const { mode } = useThemeMode()

  return (
    <div className="flex-column flex-lg-row-auto w-100 w-lg-300px w-xl-400px mb-10 mb-lg-0">
      <div className="card card-flush">
        <div className="card-header d-flex align-items-center pt-7">
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-45px bg-gray-100 w-100 rounded`}
          ></div>
        </div>

        <div className="card-body pt-5">
          <div className="scroll-y me-n5 pe-5 h-200px h-lg-auto">
            <div
              className={`skeleton${
                mode === "light" ? "-light" : ""
              } d-flex flex-stack py-4 h-80px bg-gray-100 rounded mb-3`}
            ></div>
            <div
              className={`skeleton${
                mode === "light" ? "-light" : ""
              } d-flex flex-stack py-4 h-80px bg-gray-100 rounded mb-3`}
            ></div>
            <div
              className={`skeleton${
                mode === "light" ? "-light" : ""
              } d-flex flex-stack py-4 h-80px bg-gray-100 rounded mb-3`}
            ></div>
            <div
              className={`skeleton${
                mode === "light" ? "-light" : ""
              } d-flex flex-stack py-4 h-80px bg-gray-100 rounded mb-3`}
            ></div>
            <div
              className={`skeleton${
                mode === "light" ? "-light" : ""
              } d-flex flex-stack py-4 h-80px bg-gray-100 rounded mb-3`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
