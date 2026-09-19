import { useParams } from "react-router-dom";

const pageTitles: Record<string, string> = {
  schools: "Schools Management",
  users: "Users Management",
  faculties: "Faculties Management",
  students: "Students Management",
  modules: "Modules",
  reports: "Reports",
  settings: "Settings",
  classes: "My Classes",
  grades: "Grades",
  schedule: "Schedule",
};

export default function PlaceholderPage() {
  const { "*": slug } = useParams();
  const title = pageTitles[slug || ""] || "Page";

  return (
    <div className="dash-page">
      <h1 className="dash-title">{title}</h1>
      <p className="dash-subtitle">This page is under construction.</p>
      <div className="dash-placeholder">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.18A1.125 1.125 0 014.5 17.31V6.69a1.125 1.125 0 011.536-1.04l5.384 3.18m0 0l5.384-3.18A1.125 1.125 0 0118.375 6.69v10.62a1.125 1.125 0 01-1.536 1.04l-5.384-3.18m0-7.36v7.36" />
        </svg>
        <p>Content coming soon</p>
      </div>
    </div>
  );
}
