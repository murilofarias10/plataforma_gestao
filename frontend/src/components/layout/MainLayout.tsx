import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MeetingReportModal from "@/components/meeting/MeetingReportModal";

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <MeetingReportModal />
    </div>
  );
};

export default MainLayout;
