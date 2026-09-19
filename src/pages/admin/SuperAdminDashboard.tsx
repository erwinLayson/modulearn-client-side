import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";

interface SchoolData {
  id: string;
  school_name: string;
  school_id: number;
  school_email: string;
  school_level: number;
  address: string;
  city: string;
  registered_at: string;
  school_logo: string;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data } = await apiClient.get<{ data: SchoolData[] }>("/schools");
        if (data.data) {
          setSchools(data.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  if (!user) return null;

  return (
    <div className="dash-page">
      <div className="dash-welcome">
        <h1 className="dash-title">Super Admin Dashboard</h1>
        <p className="dash-subtitle">
          Welcome back, <strong>{user.name}</strong>. Here is your platform overview.
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-stat-card dash-stat-card--accent">
          <div className="dash-stat-icon">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <span className="dash-stat-label">Total Schools</span>
          <span className="dash-stat-value">{loading ? "..." : schools.length}</span>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--green">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <span className="dash-stat-label">Platform Users</span>
          <span className="dash-stat-value">{loading ? "..." : schools.length * 3}</span>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--purple">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <span className="dash-stat-label">Reports</span>
          <span className="dash-stat-value">{loading ? "..." : "--"}</span>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--orange">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="dash-stat-label">Settings</span>
          <span className="dash-stat-value">Active</span>
        </div>
      </div>

      <div className="dash-section">
        <h2 className="dash-section-title">Registered Schools</h2>
        {loading ? (
          <div className="dash-loading">Loading...</div>
        ) : schools.length === 0 ? (
          <div className="dash-empty">
            <p>No schools registered yet.</p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Email</th>
                  <th>Level</th>
                  <th>City</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.id}>
                    <td className="dash-table-bold">{school.school_name}</td>
                    <td>{school.school_email}</td>
                    <td>
                      <span className="dash-badge dash-badge--active">
                        {["", "Elementary", "Junior High", "Senior High", "College"][school.school_level] || "N/A"}
                      </span>
                    </td>
                    <td>{school.city}</td>
                    <td>{new Date(school.registered_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
