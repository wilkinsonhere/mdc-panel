
'use client';

import * as React from 'react';
import { useFieldArray, Controller, Control, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronsUpDown, Check, Copy, Asterisk } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { type Charge, type PenalCode } from '@/stores/charge-store';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import configData from '../../../data/config.json';


const getTypeClasses = (type: Charge['type']) => {
  switch (type) {
    case 'F': return 'bg-red-500 hover:bg-red-500/80 text-white';
    case 'M': return 'bg-yellow-500 hover:bg-yellow-500/80 text-white';
    case 'I': return 'bg-green-500 hover:bg-green-500/80 text-white';
    default: return 'bg-gray-500 hover:bg-gray-500/80 text-white';
  }
};

export type FormField = {
    type: 'text' | 'textarea' | 'dropdown' | 'officer' | 'general' | 'section' | 'hidden' | 'toggle' | 'datalist' | 'charge' | 'group' | 'location' | 'input_group' | 'multi-select' | 'textarea-with-preset' | 'modifier_itemgroup';
    name: string;
    label?: string;
    placeholder?: string;
    options?: any[];
    optionsSource?: 'districts' | 'streets' | 'vehicles';
    title?: string;
    value?: string;
    dataOn?: string;
    dataOff?: string;
    defaultValue?: any;
    required?: boolean;
    multi?: boolean;
    showDivDetail?: boolean;
    showBadgeNumber?: boolean;
    stipulation?: {
        field: string;
        value: any;
    },
    stipulations?: {
        field: string;
        value: any;
    }[],
    fields?: FormField[]; // For group and input_group types
    // Charge field specific config
    showClass?: boolean;
    showOffense?: boolean;
    showAddition?: boolean;
    showCategory?: boolean;
    allowedTypes?: { F?: boolean, M?: boolean, I?: boolean };
    allowedIds?: string;
    customFields?: FormField[];
    previewFields?: {
        sentence?: boolean;
        fine?: boolean;
        impound?: boolean;
        suspension?: boolean;
    };
    copyable_charge?: boolean;
    // Location field specific config
    showDistrict?: boolean;
    // Textarea with preset
    modifiers?: any[];
    preset?: string;
    noLocalStorage?: boolean;
    refreshOn?: string[];
    prefillKey?: string;
};

interface PaperworkChargeFieldProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  penalCode: PenalCode | null;
  config: {
    name: string;
    showClass?: boolean;
    showOffense?: boolean;
    showAddition?: boolean;
    showCategory?: boolean;
    allowedTypes?: { F?: boolean, M?: boolean, I?: boolean };
    allowedIds?: string;
    customFields?: FormField[];
    previewFields?: {
        sentence?: boolean;
        fine?: boolean;
        impound?: boolean;
        suspension?: boolean;
    };
    copyCharge?: boolean;
  };
}

const CopyablePreviewField = ({
    label,
    value,
    highlight = false,
    formatAsCurrency = false,
  }: {
    label: string;
    value: string | number;
    highlight?: boolean;
    formatAsCurrency?: boolean;
  }) => {
    const { toast } = useToast();
  
    const handleCopy = () => {
      navigator.clipboard.writeText(value.toString());
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard.`,
      });
    };
  
    // Never format as currency for impound/suspension
    const isDurationOrDays =
      /impound|suspension/i.test(label);
  
    const shouldFormatAsCurrency =
      !isDurationOrDays &&
      typeof value === 'number' &&
      formatAsCurrency;
  
    const displayValue = shouldFormatAsCurrency
      ? `$${value.toLocaleString()}`
      : value;
  
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={displayValue}
            className={cn(
              'h-8 text-xs bg-card',
              highlight && 'font-semibold text-primary'
            )}
            disabled
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };


const ChargePreview = ({ charge, config, offense }: { charge: Charge, config: PaperworkChargeFieldProps['config'], offense: string }) => {
    const isDrugCharge = !!charge.drugs;

    const formatTime = (time: any) => {
        if (!time || (time.days === 0 && time.hours === 0 && time.min === 0)) return 'N/A';
        const parts = [];
        if (time.days > 0) parts.push(`${time.days}d`);
        if (time.hours > 0) parts.push(`${time.hours}h`);
        if (time.min > 0) parts.push(`${time.min}m`);
        return parts.join(' ');
    };
    
    const getFineRange = (fineObj: any) => {
        if (!fineObj || typeof fineObj !== 'object') return { min: 0, max: 0 };
        const fines = Object.values(fineObj).filter(v => typeof v === 'number') as number[];
        if (fines.length === 0) return { min: 0, max: 0 };
        return {
            min: Math.min(...fines),
            max: Math.max(...fines),
        };
    }

    const sentenceValue = isDrugCharge ? 'Varies' : `${formatTime(charge.time)} - ${formatTime(charge.maxtime)}`;
    const fineRange = getFineRange(charge.fine);
    
    const originalImpoundValue = charge.impound?.[offense as keyof typeof charge.impound] || 0;
    const impoundCapped = Math.min(originalImpoundValue, configData.MAX_IMPOUND_DAYS);
    const isImpoundCapped = originalImpoundValue > configData.MAX_IMPOUND_DAYS;

    const originalSuspensionValue = charge.suspension?.[offense as keyof typeof charge.suspension] || 0;
    const suspensionCapped = Math.min(originalSuspensionValue, configData.MAX_SUSPENSION_DAYS);
    const isSuspensionCapped = originalSuspensionValue > configData.MAX_SUSPENSION_DAYS;


    return (
        <TooltipProvider>
            <div className="mt-2 p-2 border rounded-md bg-muted/50 text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {config.previewFields?.sentence && <CopyablePreviewField label="Sentence" value={sentenceValue} />}
                {config.previewFields?.fine && (
                    <>
                        <CopyablePreviewField label="Min Fine" value={isDrugCharge ? 'Varies' : fineRange.min} highlight formatAsCurrency />
                        <CopyablePreviewField label="Max Fine" value={isDrugCharge ? 'Varies' : fineRange.max} highlight formatAsCurrency />
                    </>
                )}
                {config.previewFields?.impound && originalImpoundValue > 0 && 
                    <div className="flex items-end gap-1">
                        <CopyablePreviewField label="Impound (Days)" value={impoundCapped} highlight />
                        {isImpoundCapped && (
                            <Tooltip>
                                <TooltipTrigger><Asterisk className="h-3 w-3 text-yellow-500 mb-4" /></TooltipTrigger>
                                <TooltipContent><p>Original: {originalImpoundValue} days</p></TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                }
                {config.previewFields?.suspension && originalSuspensionValue > 0 && 
                    <div className="flex items-end gap-1">
                        <CopyablePreviewField label="Suspension (Days)" value={suspensionCapped} highlight />
                         {isSuspensionCapped && (
                            <Tooltip>
                                <TooltipTrigger><Asterisk className="h-3 w-3 text-yellow-500 mb-4" /></TooltipTrigger>
                                <TooltipContent><p>Original: {originalSuspensionValue} days</p></TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                }
            </div>
        </TooltipProvider>
    );
};


export function PaperworkChargeField({ control, register, watch, penalCode, config }: PaperworkChargeFieldProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: config.name,
  });

  const [openChargeSelector, setOpenChargeSelector] = React.useState<number | null>(null);
  const [filteredPenalCode, setFilteredPenalCode] = React.useState<Charge[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!penalCode) {
        setFilteredPenalCode([]);
        return;
    }
    const parseAllowedIds = (allowedIdsStr: string | undefined): Set<number> => {
        if (!allowedIdsStr) return new Set();
        const allowed = new Set<number>();
        const parts = allowedIdsStr.split(',').map(p => p.trim());

        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        allowed.add(i);
                    }
                }
            } else {
                const num = Number(part);
                if (!isNaN(num)) {
                    allowed.add(num);
                }
            }
        });
        return allowed;
    };
    
    const allowedTypes = config.allowedTypes ? Object.entries(config.allowedTypes).filter(([, v]) => v).map(([k]) => k) : [];
    const allowedIds = parseAllowedIds(config.allowedIds);
    
    const filtered = Object.values(penalCode).filter(charge => {
        const typeMatch = allowedTypes.length === 0 || allowedTypes.includes(charge.type);
        const idMatch = allowedIds.size === 0 || allowedIds.has(Number(charge.id));
        return typeMatch && idMatch;
    });

    setFilteredPenalCode(filtered);
  }, [penalCode, config.allowedTypes, config.allowedIds]);

  const handleChargeSelect = (index: number, chargeId: string) => {
    if (!penalCode) return;

    const currentCharge = watch(`${config.name}.${index}`);
    const isDeselecting = currentCharge.chargeId === chargeId;

    if (isDeselecting) {
      update(index, { ...currentCharge, chargeId: null, class: null, offense: null, addition: null, category: null });
      return;
    }

    const chargeDetails = penalCode[chargeId];
    if (!chargeDetails) return;

    const newValues: any = { chargeId };
    if (config.showClass) {
        let defaultClass: string | null = null;
        if (chargeDetails.class?.A) defaultClass = 'A';
        else if (chargeDetails.class?.B) defaultClass = 'B';
        else if (chargeDetails.class?.C) defaultClass = 'C';
        newValues.class = defaultClass;
    }
    if (config.showOffense) {
        let defaultOffense: string | null = null;
        if (chargeDetails.offence?.['1']) defaultOffense = '1';
        else if (chargeDetails.offence?.['2']) defaultOffense = '2';
        else if (chargeDetails.offence?.['3']) defaultOffense = '3';
        else if (chargeDetails.offence?.['4']) defaultOffense = '4';
        else if (chargeDetails.offence?.['5']) defaultOffense = '5';
        newValues.offense = defaultOffense;
    }
    if (config.showAddition) {
        newValues.addition = 'Offender';
    }

    update(index, { ...currentCharge, ...newValues });
  };
  
  const getChargeDetails = React.useCallback((chargeId: string | null): Charge | null => {
    if (!chargeId || !penalCode) return null;
    return penalCode[chargeId] || null;
  }, [penalCode]);

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const chargeDetails = getChargeDetails(watch(`${config.name}.${index}.chargeId`));
        const offenseValue = watch(`${config.name}.${index}.offense`) || '1';

        const handleCopyCharge = () => {
            if (!chargeDetails) return;
            let text = `${chargeDetails.id}. ${chargeDetails.charge}`;
            navigator.clipboard.writeText(text);
            toast({ title: 'Copied!', description: 'Charge copied to clipboard.' });
        };

        return (
            <div key={field.id} className="p-4 border rounded-lg">
                <div className="flex items-end gap-2">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
                        {/* Charge Dropdown */}
                        <div className="space-y-1.5 md:col-span-2">
                            <Label>Charge</Label>
                            <Popover open={openChargeSelector === index} onOpenChange={(isOpen) => setOpenChargeSelector(isOpen ? index : null)}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-9">
                                        {chargeDetails ? (
                                            <span className="flex items-center">
                                                <Badge className={cn('mr-2 rounded-sm px-1.5 py-0.5 text-xs', getTypeClasses(chargeDetails.type))}>{chargeDetails.id}</Badge>
                                                <span className="truncate">{chargeDetails.charge}</span>
                                            </span>
                                        ) : 'Select a charge...'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command filter={(value, search) => {
                                        if (!penalCode) return 0;
                                        const charge = filteredPenalCode.find(c => c.id === value);
                                        if (!charge) return 0;
                                        const term = search.toLowerCase();
                                        return charge.charge.toLowerCase().includes(term) || charge.id.includes(term) ? 1 : 0;
                                    }}>
                                        <CommandInput placeholder="Search charge by name or ID..." />
                                        <CommandEmpty>No charge found.</CommandEmpty>
                                        <CommandList>
                                            <CommandGroup>
                                                {filteredPenalCode.map((c) => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={c.id}
                                                        onSelect={(currentValue) => {
                                                            handleChargeSelect(index, currentValue);
                                                            setOpenChargeSelector(null);
                                                        }}
                                                        disabled={c.type === '?'}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', watch(`${config.name}.${index}.chargeId`) === c.id ? 'opacity-100' : 'opacity-0')} />
                                                        <Badge className={cn('mr-2 rounded-sm px-1.5 py-0.5 text-xs', getTypeClasses(c.type))}>{c.id}</Badge>
                                                        <span className="flex-1 truncate">{c.charge}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Standard Fields */}
                        {config.showClass && (
                            <div className="space-y-1.5">
                                <Label>Class</Label>
                                <Controller
                                    name={`${config.name}.${index}.class`}
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value || ''} onValueChange={onChange} disabled={!chargeDetails}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select class" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A" disabled={!chargeDetails?.class?.A}>Class A</SelectItem>
                                                <SelectItem value="B" disabled={!chargeDetails?.class?.B}>Class B</SelectItem>
                                                <SelectItem value="C" disabled={!chargeDetails?.class?.C}>Class C</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        )}

                        {config.showOffense && (
                            <div className="space-y-1.5">
                                <Label>Offense</Label>
                                <Controller
                                    name={`${config.name}.${index}.offense`}
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value || ''} onValueChange={onChange} disabled={!chargeDetails}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select offense" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1" disabled={!chargeDetails?.offence?.['1']}>Offense #1</SelectItem>
                                                <SelectItem value="2" disabled={!chargeDetails?.offence?.['2']}>Offense #2</SelectItem>
                                                <SelectItem value="3" disabled={!chargeDetails?.offence?.['3']}>Offense #3</SelectItem>
                                                <SelectItem value="4" disabled={!chargeDetails?.offence?.['4']}>Offense #4</SelectItem>
                                                <SelectItem value="5" disabled={!chargeDetails?.offence?.['5']}>Offense #5</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        )}
                        
                        {config.customFields?.map(customField => (
                            <div key={customField.name} className="space-y-1.5">
                                <Label>{customField.label}</Label>
                                <Input {...register(`${config.name}.${index}.${customField.name}`)} placeholder={customField.placeholder} />
                            </div>
                        ))}

                    </div>
                    {config.copyCharge && chargeDetails && (
                        <Button type="button" variant="outline" size="icon" onClick={handleCopyCharge} className="h-9 w-9">
                            <Copy className="h-5 w-5" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 h-9 w-9">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
                {chargeDetails && config.previewFields && <ChargePreview charge={chargeDetails} config={config} offense={offenseValue} />}
            </div>
        );
      })}
      <Button type="button" variant="outline" onClick={() => append({})}>
        <Plus className="mr-2 h-4 w-4" /> Add Charge/Citation
      </Button>
    </div>
  );
}
