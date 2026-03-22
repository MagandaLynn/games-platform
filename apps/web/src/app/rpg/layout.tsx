import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RPG Adventure - PlaySeed",
  description: "Embark on an epic RPG adventure",
};

export default function RPGLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
