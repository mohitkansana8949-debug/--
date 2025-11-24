import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentDecks } from "@/components/dashboard/recent-decks";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeBanner />
      <StatsCards />
      <RecentDecks />
    </div>
  );
}
