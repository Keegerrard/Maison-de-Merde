"use client";

import { useDashboard } from "@/hooks/useDashboard";
import SkeletonBlock from "../ui/SkeletonBlock";
import StatTriad from "./StatTriad";
import GoldCircleActions from "./GoldCircleActions";
import ConsistencyHeatmap from "./ConsistencyHeatmap";
import BristolDistribution from "./BristolDistribution";
import DoctorExportCard from "./DoctorExportCard";

export default function DashboardPanel() {
  const { data, loading, error } = useDashboard();

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonBlock className="h-32 w-full" />
        <SkeletonBlock className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <SkeletonBlock className="h-80 w-full md:col-span-8" />
          <div className="flex flex-col gap-6 md:col-span-4">
            <SkeletonBlock className="h-48 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return <p className="text-body text-claret-600">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <StatTriad />
      <GoldCircleActions />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <ConsistencyHeatmap />
        </div>
        <div className="flex flex-col gap-6 md:col-span-4">
          <BristolDistribution />
          <DoctorExportCard />
        </div>
      </div>
    </div>
  );
}
