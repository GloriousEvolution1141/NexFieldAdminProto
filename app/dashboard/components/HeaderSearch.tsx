"use client";

import { useSearch } from "@/app/dashboard/components/SearchContext";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";

export function HeaderSearch() {
  const { query, setQuery } = useSearch();

  return (
    <Field className="w-full">
      <InputGroup className="bg-slate-100/80 hover:bg-slate-100 focus-within:bg-white border-transparent focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all rounded-full h-10">
        <InputGroupAddon align="inline-start" className="pl-4">
          <SearchIcon className="text-slate-400 h-[18px] w-[18px]" />
        </InputGroupAddon>
        <InputGroupInput
          id="inline-start-input"
          placeholder="Buscar..."
          className="text-[14px] text-slate-700 placeholder:text-slate-400 shadow-none bg-transparent border-none focus-visible:ring-0 px-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>
    </Field>
  );
}
