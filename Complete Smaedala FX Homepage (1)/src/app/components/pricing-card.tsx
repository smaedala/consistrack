import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  onCtaClick?: () => void;
}

export function PricingCard({
  title,
  subtitle,
  price,
  features,
  isPopular = false,
  ctaText,
  onCtaClick,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-xl p-8 transition-all hover:scale-105 ${
        isPopular
          ? "border-2 border-[#00F2FE] shadow-lg shadow-[#00F2FE]/20"
          : "border border-gray-700"
      }`}
      style={{ backgroundColor: "#1E2025" }}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#00F2FE] px-4 py-1">
          <span className="text-xs text-black">Most Popular</span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="mb-2 text-xl text-white">{title}</h3>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl text-white">{price}</span>
        {price !== "Contact Us" && <span className="text-gray-400">/mo</span>}
      </div>
      <button
        onClick={onCtaClick}
        className={`mb-6 w-full rounded-lg px-6 py-3 transition-all ${
          isPopular
            ? "bg-[#00F2FE] text-black hover:bg-[#00D8E8]"
            : "border border-[#00F2FE] text-[#00F2FE] hover:bg-[#00F2FE] hover:text-black"
        }`}
      >
        {ctaText}
      </button>
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#10B981]" />
            <span className="text-sm text-gray-300">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
