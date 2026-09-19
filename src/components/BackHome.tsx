import { Link } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";

interface BackHomeProps {
  variant?: "light" | "dark";
}

export default function BackHome({ variant = "light" }: BackHomeProps) {
  return (
    <Link
      to="/"
      title="Back to home"
      aria-label="Back to home"
      className={`auth-back${variant === "dark" ? " auth-back--dark" : ""}`}
    >
      <FaArrowLeftLong />
    </Link>
  );
}