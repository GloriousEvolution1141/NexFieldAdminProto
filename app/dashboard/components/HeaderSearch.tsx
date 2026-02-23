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
            <InputGroup className="bg-muted/50 focus-within:bg-background border-dashed border-muted-foreground/30 hover:bg-white transition-all duration-300">
                <InputGroupInput
                    id="inline-start-input"
                    placeholder="Buscar registros..."
                    className="text-sm shadow-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <InputGroupAddon align="inline-start">
                    <SearchIcon className="text-muted-foreground/70 h-4 w-4" />
                </InputGroupAddon>
            </InputGroup>
        </Field>
    );
}
