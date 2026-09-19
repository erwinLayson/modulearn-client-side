import { useNavigate } from "react-router-dom";

const linkGroups = [
  { href: "#about", label: "About" },
  { href: "#how", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="land-nav">
      <div className="land-nav-inner">
        <a href="#hero" className="land-logo">
          <span className="land-logo-mark">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </span>
          ModuLearn
        </a>

        <nav className="land-nav-links">
          {linkGroups.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/login")} className="land-btn land-btn--outline land-btn--sm">
            Sign in
          </button>
          <button onClick={() => navigate("/register")} className="land-btn land-btn--primary land-btn--sm">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}