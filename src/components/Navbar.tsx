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
            <img src="/startup-logo.png" alt="" />
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