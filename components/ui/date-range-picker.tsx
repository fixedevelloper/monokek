"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/src/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverClose,
} from "@/components/ui/popover";

interface DateRangePickerProps {
    onApply: (range: DateRange | undefined) => void;
    initialRange: DateRange | undefined;
    className?: string;
}

export function DateRangePicker({
                                    onApply,
                                    initialRange,
                                    className
                                }: DateRangePickerProps) {
    // On utilise un état local "temp" pour ne pas trigger le parent avant le clic final
    const [tempRange, setTempRange] = useState<DateRange | undefined>(initialRange);

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="ghost"
                        className={cn(
                            "h-11 px-4 justify-start text-left font-black uppercase text-[10px] tracking-widest bg-white shadow-sm rounded-2xl border border-slate-100",
                            !tempRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
                        {tempRange?.from ? (
                            tempRange.to ? (
                                <>
                                    {format(tempRange.from, "dd MMM", { locale: fr })} -{" "}
                                    {format(tempRange.to, "dd MMM yyyy", { locale: fr })}
                                </>
                            ) : (
                                format(tempRange.from, "dd MMM yyyy", { locale: fr })
                            )
                        ) : (
                            <span>Choisir une période</span>
                        )}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={tempRange?.from}
                        selected={tempRange}
                        onSelect={setTempRange}
                        numberOfMonths={2}
                        locale={fr}
                        className="p-4 font-bold"
                    />

                    <div className="p-3 border-t border-dashed flex justify-end bg-slate-50/50 rounded-b-3xl">
                        <PopoverClose asChild>
                            <Button
                                size="sm"
                                className="rounded-xl font-black uppercase text-[10px] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 px-6"
                                onClick={() => onApply(tempRange)}
                            >
                                <Check className="mr-2 h-3 w-3" />
                                Appliquer la période
                            </Button>
                        </PopoverClose>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}