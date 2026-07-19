import { Link } from "react-router-dom";

const LINKS = [
  { to: "/reports", label: "Overview" },
  { to: "/reports/recruitment", label: "Recruitment" },
  { to: "/reports/funnel", label: "Funnel" },
  { to: "/reports/departments", label: "Departments" },
  { to: "/reports/interviews", label: "Interviews" },
  { to: "/reports/offers", label: "Offers" },
  { to: "/reports/onboarding", label: "Onboarding" },
  { to: "/reports/employees", label: "Employees" },
];

type ReportsNavProps = {
  current: string;
};

export function ReportsNav({ current }: ReportsNavProps) {
  return (
    <nav className="reports-nav">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          className={`reports-nav__link ${
            current === link.to ? "reports-nav__link--active" : ""
          }`}
          to={link.to}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
