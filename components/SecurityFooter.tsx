import React from "react";
import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
  colorClass: string;
}

interface SecurityFooterProps {
  policyType: "auth" | "recovery";
  links: FooterLink[];
}

export function SecurityFooter({ policyType, links }: SecurityFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-850 flex flex-col gap-4 text-xs text-slate-400 dark:text-slate-500">
      <p className="leading-normal text-[11px] text-center lg:text-left">
        <strong className="text-slate-655 dark:text-slate-350">
          {policyType === "auth" ? "Authorized Use Only:" : "Security Policy:"}
        </strong>{" "}
        {policyType === "auth"
          ? "By accessing this system, you agree to comply with the university Acceptable Computer Use Policy. Logins are encrypted and recorded."
          : "Centralized authentication recovery is audited. IP addresses and timestamps are recorded for security logs."}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] pt-2 w-full">
        <div>© {currentYear} SBS State University.</div>
        <div className="flex gap-3 font-semibold">
          {links.map((link, index) => (
            <React.Fragment key={link.href}>
              <Link
                href={link.href}
                className={`${link.colorClass} hover:underline transition-colors`}
              >
                {link.label}
              </Link>
              {index < links.length - 1 && <span>•</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
