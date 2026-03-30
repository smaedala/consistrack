import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="rounded-xl p-8 transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#00F2FE]/10"
      style={{ backgroundColor: "#1E2025" }}
    >
      <div className="mb-4 inline-flex rounded-lg bg-[#00F2FE]/10 p-3">
        <Icon className="h-8 w-8 text-[#00F2FE]" />
      </div>
      <h3 className="mb-3 text-xl text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
