import { useThemeMode } from "../../../../_metronic/partials/layout/theme-mode/ThemeModeProvider"

export const ChatSkeleton = () => {
  const { mode } = useThemeMode()

  return (
    <div className="flex-lg-row-fluid ms-lg-7 ms-xl-10">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-20px w-200px bg-gray-100 rounded me-auto`}
          ></div>
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-20px w-200px bg-gray-100 rounded ms-2`}
          ></div>
        </div>
        <div className="card-body">
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-40px w-300px bg-gray-100 rounded mb-3`}
          ></div>
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-40px w-200px bg-gray-100 rounded mb-3 ms-auto`}
          ></div>
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-40px w-300px bg-gray-100 rounded mb-3 ms-auto`}
          ></div>
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-40px w-200px bg-gray-100 rounded mb-3`}
          ></div>
          <div
            className={`skeleton${
              mode === "light" ? "-light" : ""
            } d-flex flex-stack py-4 h-40px w-300px bg-gray-100 rounded mb-3`}
          ></div>
        </div>
      </div>
    </div>
  )
}
