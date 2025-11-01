"use client";

import { ChangeEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDashboardContext } from "../context/dashboard-context";

export function DashboardSearchBar() {
  const { searchQuery, setSearchQuery } = useDashboardContext();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        data-testid="search-input"
        value={searchQuery}
        onChange={handleChange}
        placeholder="분석 대상자 이름을 검색하세요"
        className="pl-9"
      />
    </div>
  );
}
