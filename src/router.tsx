// router.js
import { createBrowserRouter } from "react-router-dom";
import App from "./App";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ClientReportPage from "./pages/client/ClientReportPage";
import SpeechDetailPage from "./pages/counseling/AnalysisPage";
import UploadPage from "./pages/counseling/UploadPage";
import HomePage from "./pages/home/HomePage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,   // 전체 레이아웃
    children: [
      // 1) 기본 홈 (/)
      { index: true, element: <HomePage /> },

      // 2) /:folderId (내담자별 상담 목록)
      { path: ":folderId", element: <HomePage /> },

      // 3) /:folderId/:speechId (상담 상세 분석)
      { path: ":folderId/:speechId", element: <SpeechDetailPage /> },

      // 4) /client/:clientId (내담자 감정 분석 리포트)
      { path: "client/:clientId", element: <ClientReportPage /> },

      // 5) /upload (음성 파일 업로드)
      { path: "upload", element: <UploadPage /> },

      // 6) /login
      { path: "login", element: <LoginPage /> },

      // 7) /sign-up
      { path: "sign-up", element: <SignUpPage /> },
    ],
  },
]);

export default router;
