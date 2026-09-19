import { useNavigate } from "react-router-dom";

const linkGroups = [
  { href: "#about", label: "About" },
  { href: "#how", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="land-footer">
      <div className="land-container">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="land-footer-title flex items-center gap-2 text-lg">
              <span className="land-logo-mark">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </span>
              ModuLearn
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Classes, attendance, and grades for every school level. Built to
              organize, teach, and track progress in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            {linkGroups.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <button
              onClick={() => navigate("/register")}
              className="text-left transition-colors hover:text-[var(--ml-accent-hover)]"
            >
              Register your school
            </button>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm">
          © {new Date().getFullYear()} ModuLearn. All rights reserved.
        </div>
      </div>
    </footer>
  );
}