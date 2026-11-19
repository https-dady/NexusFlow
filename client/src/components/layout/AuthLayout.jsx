import { Link } from 'react-router-dom';
import { ArrowUpRight, Activity, BellRing, Cpu, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from './Logo.jsx';

const highlights = [
  {
    icon: Cpu,
    title: 'Simulation-first devices',
    description: 'Spin up realistic climate, energy and air-quality sensors without hardware.',
  },
  {
    icon: Activity,
    title: 'Live telemetry pipeline',
    description:
      'Streaming dashboards, historical rollups and CSV exports from one source of truth.',
  },
  {
    icon: BellRing,
    title: 'Safe rule engine',
    description: 'Structured conditions and threshold alerts — no arbitrary code execution.',
  },
];

export function AuthLayout({ children, title, description, footer }) {
  return (
    <div className="flex min-h-screen bg-cloud">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink p-10 text-white lg:flex xl:p-14">
        <div className="grain pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-flame/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10.5px] font-semibold tracking-[0.16em] text-white/65 uppercase">
            <Sparkles className="h-3 w-3 text-gold" /> Telemetry OS
          </span>
          <h2 className="mt-5 text-[34px] leading-[1.08] font-extrabold tracking-[-0.045em] xl:text-[40px]">
            The calm control room for your IoT fleet.
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-white/55">
            NexusFlow brings devices, live telemetry, a visual rule engine and operational analytics
            into a single workspace — built to be demo-ready on day one.
          </p>

          <div className="mt-8 space-y-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-flame/15 text-flame">
                  <item.icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[12.5px] font-bold text-white">{item.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/45">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-[10.5px] text-white/35">
          <span>© {new Date().getFullYear()} NexusFlow</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> Actuators stay disabled by design
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col lg:w-[54%]">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            to="/login"
            className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-muted transition hover:text-ink"
          >
            Product overview <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[420px]">
            <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.045em] text-ink sm:text-[32px]">
              {title}
            </h1>
            {description && (
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{description}</p>
            )}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-[12px] text-muted">{footer}</div>}
          </div>
        </div>

        <div className="px-5 pb-6 text-center text-[10.5px] text-muted/80 sm:px-8">
          NexusFlow v1.0 · Visual IoT Telemetry &amp; Rule Engine
        </div>
      </div>
    </div>
  );
}
