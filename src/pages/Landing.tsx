import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FaqItem from "../components/FaqItem";
import PricingCard from "../components/PricingCard";

const aboutItems = [
  {
    title: "Class & subject management",
    description:
      "Organize classes by grade level and section, assign faculty per subject, and keep a single source of truth for your school's curriculum.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: "Attendance tracking",
    description:
      "Take attendance per subject in a spreadsheet-style view, mark absences with a click, and view history per student, class, or the whole school.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  {
    title: "Gradebook",
    description:
      "Record scores per subject, let the system compute grades automatically, and give students a clear view of their standing at any time.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Enrollments & school years",
    description:
      "Enroll students into classes scoped to each school year, so records stay organized from first enrollment to graduation.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a48.667 48.667 0 00-7-7.98 48.667 48.667 0 00-7 7.98m9-11.522v.002m0 0v-.002m0 .002v-.002m0 0V9.75a3 3 0 11-6 0v-.002m9 3.842a48.21 48.21 0 00-2.775-5.917M4.5 19.5c1.532 0 3.032-.286 4.5-.834m11.5-1.166c1.532 0 3.032-.286 4.5-.834" />
      </svg>
    ),
  },
  {
    title: "Built for every role",
    description:
      "School admins manage the school, faculty teach and record, and students track their own attendance and grades — everyone gets a purpose-built dashboard.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "School-wide reports",
    description:
      "Attendance reports across classes, subjects, and dates — filter, review trends, and spot students who need attention early.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

const steps = [
  {
    step: "01",
    title: "Register your school",
    description:
      "Fill in the registration form and get your school admin account — it only takes a minute.",
  },
  {
    step: "02",
    title: "Set up faculty, students & classes",
    description:
      "Add your faculty and students, create classes by grade level and section, assign subjects, and enroll students for the school year.",
  },
  {
    step: "03",
    title: "Record attendance & grades",
    description:
      "Faculty take attendance and record scores per subject while students and admins follow progress in real time.",
  },
];

const faqItems = [
  {
    question: "How do I register my school?",
    answer:
      "Click “Get Started”, fill in the school registration form (name, ID, level, address, and admin details), and you'll get an admin account to start building modules.",
  },
  {
    question: "Is ModuLearn free?",
    answer:
      "Yes — the Free plan covers up to 100 students and one admin account. Growing schools can upgrade to the School or District plan for unlimited students, school-wide reports, and priority support.",
  },
  {
    question: "Which school levels are supported?",
    answer:
      "All of them. Register your institution as elementary, junior or senior high school, or college/university, then organize classes and subjects for the right grade levels.",
  },
  {
    question: "How does attendance tracking work?",
    answer:
      "Faculty create an attendance session for a class and subject on any date, then mark each student present or absent in a spreadsheet-style view. Students see their own history and rates, and school admins get full attendance reports.",
  },
  {
    question: "How does the gradebook work?",
    answer:
      "Faculty record scores per class and subject, and the system computes each student's grade automatically. Students can view their grades per subject at any time from their own dashboard.",
  },
  {
    question: "Can I update my school information later?",
    answer:
      "Yes. School admins can edit profile details such as address, contact numbers, and logo from the dashboard after sign-up.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--ml-page-bg)]">
      <Navbar />

      {/* hero */}
      <section id="hero" className="land-hero">
        <div className="land-container flex flex-col items-center gap-12 lg:grid lg:grid-cols-2 lg:items-center">
          <div className="text-center lg:text-left">
            <span className="land-eyebrow">ModuLearn</span>
            <h1 className="text-4xl font-extrabold leading-tight text-[var(--ml-text)] md:text-5xl">
              Classes, attendance & grades,
              <span className="block text-[var(--ml-accent-active)]">
                in one place
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--ml-text-secondary)] lg:mx-0">
              Manage classes, take attendance, and record grades for every
              level — from elementary to college — in one workspace.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                onClick={() => navigate("/register")}
                className="land-btn land-btn--primary w-full sm:w-auto"
              >
                Register your school
              </button>
              <a
                href="#pricing"
                className="land-btn land-btn--ghost w-full sm:w-auto"
              >
                See pricing
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
            <p className="mt-5 text-sm text-[var(--ml-text-muted)]">
              Free for schools · No credit card required
            </p>
          </div>

          {/* mock dashboard card */}
          <div className="land-mock w-full max-w-md p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="land-logo-mark">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--ml-text)]">
                    Biology · Grade 9
                  </p>
                  <p className="text-xs text-[var(--ml-text-muted)]">Cell Structure</p>
                </div>
              </div>
              <span className="text-sm font-bold text-[var(--ml-accent-active)]">42%</span>
            </div>

            <div className="land-progress mt-4">
              <div className="land-progress-fill" style={{ width: "42%" }} />
            </div>

            <ul className="mt-6 space-y-3">
              {[
                { label: "Introduction to cells", status: "done" },
                { label: "Organelles & function", status: "current" },
                { label: "Cell division", status: "locked" },
              ].map((lesson) => (
                <li
                  key={lesson.label}
                  className="flex items-center justify-between rounded-lg border border-[var(--ml-border)] bg-[var(--ml-surface-alt)] px-3 py-2 text-sm"
                >
                  <span className="text-[var(--ml-text)]">{lesson.label}</span>
                  {lesson.status === "done" && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ml-accent)] text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  )}
                  {lesson.status === "current" && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--ml-accent)]" />
                  )}
                  {lesson.status === "locked" && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--ml-text-muted)]" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* about */}
      <section id="about" className="bg-[var(--ml-card-bg)]">
        <div className="land-container">
          <div className="max-w-2xl">
            <span className="land-eyebrow">About</span>
            <h2 className="land-section-title">
              Everything your school runs on, in one place
            </h2>
            <p className="land-section-sub">
              ModuLearn gives school admins, faculty, and students a single
              workspace for classes, attendance, and grades — no spreadsheets,
              no scattered tools.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {aboutItems.map((item) => (
              <div key={item.title} className="land-card">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--ml-primary)] text-[var(--ml-on-primary-soft)]">
                  {item.icon}
                </span>
                <h3 className="text-lg font-semibold text-[var(--ml-text)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ml-text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="bg-[var(--ml-page-bg)]">
        <div className="land-container">
          <div className="max-w-2xl">
            <span className="land-eyebrow">How It Works</span>
            <h2 className="land-section-title">Up and running in three steps</h2>
            <p className="land-section-sub">
              From registration to your first recorded attendance session — no setup headaches.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="land-step-num">{step.step}</div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ml-text)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ml-text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="bg-[var(--ml-card-bg)]">
        <div className="land-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="land-eyebrow">Pricing</span>
            <h2 className="land-section-title">Simple plans for every school</h2>
            <p className="land-section-sub mx-auto">
              Start free, upgrade when your school grows. All plans include
              classes, attendance tracking, and gradebooks.
            </p>
          </div>

          <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="For schools getting started"
              features={[
                "Single admin account",
                "Up to 100 students",
                "Classes, subjects & enrollments",
                "Attendance & gradebook",
                "Community support",
              ]}
              cta="Start Free"
              onCta={() => navigate("/register")}
            />
            <PricingCard
              name="School"
              price="$49"
              period="/ month"
              description="For active, growing schools"
              features={[
                "Multiple admin accounts",
                "Unlimited students",
                "School-wide attendance reports",
                "Custom school branding",
                "Priority support",
              ]}
              featured
              cta="Choose School"
              onCta={() => navigate("/register")}
            />
            <PricingCard
              name="District"
              price="Custom"
              description="For districts & divisions"
              features={[
                "Everything in School",
                "Multi-school management",
                "Dedicated success manager",
                "On-site training",
              ]}
              cta="Contact Sales"
              onCta={() => navigate("/register")}
            />
          </div>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="bg-[var(--ml-page-bg)]">
        <div className="land-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="land-eyebrow">FAQ</span>
            <h2 className="land-section-title">Frequently asked questions</h2>
            <p className="land-section-sub mx-auto">
              Everything you need to know before signing up.
            </p>
          </div>

          <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-3">
            {faqItems.map((item) => (
              <FaqItem key={item.question} {...item} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}