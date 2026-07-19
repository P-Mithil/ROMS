type IconName =
  | "home"
  | "briefcase"
  | "users"
  | "calendar"
  | "fileText"
  | "clipboard"
  | "userCheck"
  | "barChart"
  | "search"
  | "filter"
  | "download"
  | "plus"
  | "check"
  | "x"
  | "sparkles"
  | "alert"
  | "inbox";

type IconProps = {
  name: IconName;
  className?: string;
  title?: string;
};

const PATHS: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z",
  briefcase:
    "M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4zm2 0h2V5h-2v1z",
  users:
    "M16 11a4 4 0 1 0-3.2-6.4A4 4 0 0 0 16 11zM8 12a4 4 0 1 0-3.2-6.4A4 4 0 0 0 8 12zm8 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4zM8 14c-.7 0-1.4.1-2 .2C3.4 14.7 1 16 1 18v2h6v-2c0-1.5.7-2.8 2.1-3.7-.7-.2-1.4-.3-2.1-.3z",
  calendar:
    "M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8H5v10h14V10z",
  fileText:
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 2.5L17.5 8H14V4.5zM8 13h8v2H8v-2zm0 4h8v2H8v-2zm0-8h4v2H8V9z",
  clipboard:
    "M9 3h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V5a2 2 0 0 1 2-2zm0 3h6V5H9v1zm-1 4h8v2H8v-2zm0 4h8v2H8v-2z",
  userCheck:
    "M12 12a4 4 0 1 0-3.2-6.4A4 4 0 0 0 12 12zm-8 9v-1c0-2.7 4.3-4 8-4 .7 0 1.4.1 2 .2l-1.5 1.5A9.5 9.5 0 0 0 12 18c-2.8 0-6 1.2-6 2v1H4zm13.3-5.3 1.4-1.4 2.1 2.1 3.5-3.5 1.4 1.4-4.9 4.9-3.5-3.5z",
  barChart:
    "M4 20h16v2H2V3h2v17zm4-2h2V10H8v8zm4 0h2V6h-2v12zm4 0h2v-7h-2v7z",
  search:
    "M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm7.2 11.1 3.6 3.6-1.4 1.4-3.6-3.6 1.4-1.4z",
  filter:
    "M3 5h18l-7 8v5l-4 2v-7L3 5z",
  download:
    "M12 3v10.2l3.6-3.6 1.4 1.4L12 17l-5-5 1.4-1.4L11 13.2V3h1zm-7 16h14v2H5v-2z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z",
  check: "M9.5 16.2 4.8 11.5l1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4-9.7 9.7z",
  x: "M6.7 5.3 12 10.6l5.3-5.3 1.4 1.4L13.4 12l5.3 5.3-1.4 1.4L12 13.4l-5.3 5.3-1.4-1.4L10.6 12 5.3 6.7l1.4-1.4z",
  sparkles:
    "M12 2l1.2 4.2L17.5 7.5l-4.3 1.3L12 13l-1.2-4.2L6.5 7.5l4.3-1.3L12 2zm7 9 .8 2.7 2.7.8-2.7.8L19 18l-.8-2.7-2.7-.8 2.7-.8L19 11zM5 13l.7 2.3L8 16l-2.3.7L5 19l-.7-2.3L2 16l2.3-.7L5 13z",
  alert:
    "M12 3 2 21h20L12 3zm0 5 6.5 11h-13L12 8zm-1 4h2v4h-2v-4zm0 6h2v2h-2v-2z",
  inbox:
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v7h4l2 3h4l2-3h4V6H4z",
};

export function Icon({ name, className, title }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d={PATHS[name]} />
    </svg>
  );
}
