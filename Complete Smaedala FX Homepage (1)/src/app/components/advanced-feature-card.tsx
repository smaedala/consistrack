import { LucideIcon } from "lucide-react";

interface AdvancedFeatureCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  color?: "cyan" | "green" | "purple" | "orange";
}

export function AdvancedFeatureCard({
  icon: Icon,
  title,
  subtitle,
  description,
  badge,
  color = "cyan",
}: AdvancedFeatureCardProps) {
  const colorClasses = {
    cyan: {
      bg: "bg-[#00F2FE]/10",
      text: "text-[#00F2FE]",
      border: "border-[#00F2FE]/30",
      badge: "bg-[#00F2FE] text-black",
    },
    green: {
      bg: "bg-[#10B981]/10",
      text: "text-[#10B981]",
      border: "border-[#10B981]/30",
      badge: "bg-[#10B981] text-black",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/30",
      badge: "bg-purple-500 text-white",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/30",
      badge: "bg-orange-500 text-white",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${colors.border} p-8 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-${color}-500/20`}
      style={{ backgroundColor: "#1E2025" }}
    >
      {badge && (
        <div className={`absolute right-4 top-4 rounded-full ${colors.badge} px-3 py-1 text-xs`}>
          {badge}
        </div>
      )}
      <div className={`mb-4 inline-flex rounded-lg ${colors.bg} p-4`}>
        <Icon className={`h-8 w-8 ${colors.text}`} />
      </div>
      <h3 className={`mb-2 text-2xl ${colors.text}`}>{title}</h3>
      <p className="mb-3 text-sm text-gray-500">{subtitle}</p>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
