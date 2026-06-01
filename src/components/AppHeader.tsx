interface Props {
  title: string;
  subtitle?: string;
}

// Top header with the SHOW TIME logo, shown on main tab pages.
export default function AppHeader({ title, subtitle }: Props) {
  return (
    <header className="app-header">
      <img className="logo" src="/LOGO.jpg" alt="SHOW TIME" />
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
    </header>
  );
}
