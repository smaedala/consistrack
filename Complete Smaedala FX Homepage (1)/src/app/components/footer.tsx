import { Twitter, Linkedin, MessageSquare } from "lucide-react";

export function Footer() {
  const footerSections = [
    {
      title: "Platform",
      links: ["Dashboard", "Trade Log", "Strategy Journal", "MT4 Sync"],
    },
    {
      title: "Resources",
      links: ["Blog", "Prop Firm Rule Guide", "Help Center", "API Docs"],
    },
    {
      title: "Company",
      links: ["About Us", "Careers", "Contact", "Press"],
    },
  ];

  return (
    <footer className="border-t border-gray-800 py-12" style={{ backgroundColor: "#101217" }}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo and Social */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-2xl text-[#00F2FE]">Smaedala FX</h2>
            <p className="mb-6 text-sm text-gray-400">
              The precision tool built by traders, for traders.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="rounded-lg bg-[#1E2025] p-2 text-gray-400 transition-colors hover:text-[#00F2FE]"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg bg-[#1E2025] p-2 text-gray-400 transition-colors hover:text-[#00F2FE]"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg bg-[#1E2025] p-2 text-gray-400 transition-colors hover:text-[#00F2FE]"
                aria-label="Discord"
              >
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="mb-4 text-white">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 transition-colors hover:text-[#00F2FE]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 Smaedala FX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
