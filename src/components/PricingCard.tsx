interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  featured?: boolean;
  cta: string;
  onCta: () => void;
}

function CheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  featured = false,
  cta,
  onCta,
}: PricingCardProps) {
  const className = [
    "land-price",
    featured ? "land-price land-price--dark" : "",
  ].join(" ").trim();

  return (
    <div className={className}>
      <p className="land-price-name">{name}</p>
      <p className="land-price-sub">{description}</p>
      <p className="land-price-amount">
        {price}
        {period && <span className="land-price-period"> {period}</span>}
      </p>
      <ul className="land-price-features">
        {features.map((feature) => (
          <li key={feature} className="land-price-feature">
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        className={`land-btn w-full ${featured ? "land-btn--primary" : "land-btn--outline"} mt-6`}
      >
        {cta}
      </button>
    </div>
  );
}