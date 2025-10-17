
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Control, Controller, useFormContext, useFieldArray } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useScopedI18n } from '@/lib/i18n/client';

export type Modifier = {
    name: string;
    label: string;
    text?: string;
    requires?: string[];
    inputGroup?: {
        label: string;
        fields: any[];
    };
};

interface TextareaWithPresetProps {
    label: string;
    placeholder?: string;
    description?: React.ReactNode;
    basePath: string;
    control: Control<any>;
    modifiers: Modifier[];
    isInvalid: boolean;
    noLocalStorage?: boolean;
    presetValue: string;
    onTextChange?: (value: string) => void;
    onUserModifiedChange?: (value: boolean) => void;
    onModifierChange?: (name: string, value: boolean) => void;
    onPresetChange?: (value: boolean) => void;
    externalInputGroupNames?: string[];
}

export function TextareaWithPreset({
    label,
    placeholder,
    description,
    basePath,
    control,
    modifiers,
    isInvalid,
    noLocalStorage = false,
    presetValue,
    onTextChange,
    onUserModifiedChange,
    onModifierChange,
    onPresetChange,
    externalInputGroupNames = [],
}: TextareaWithPresetProps) {
    const { watch, setValue, getValues, trigger, register } = useFormContext();
    const [localValue, setLocalValue] = useState(getValues(`${basePath}.narrative`) || '');
    const isInitialMount = useRef(true);
    const t = useScopedI18n('shared.textareaWithPreset');

    const isPresetEnabled = watch(`${basePath}.isPreset`);
    const isUserModified = watch(`${basePath}.userModified`);
    const watchedNarrative = watch(`${basePath}.narrative`);

    useEffect(() => {
        if (typeof watchedNarrative === 'undefined') {
            return;
        }

        const normalizedWatchedNarrative = watchedNarrative || '';

        setLocalValue((previous: string) => (previous === normalizedWatchedNarrative ? previous : normalizedWatchedNarrative));
    }, [watchedNarrative]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (isPresetEnabled && !isUserModified && localValue !== presetValue) {
            setLocalValue(presetValue);
            setValue(`${basePath}.narrative`, presetValue, { shouldDirty: true });
            onTextChange?.(presetValue);
        }
    }, [presetValue, isPresetEnabled, isUserModified, setValue, onTextChange, localValue]);


    const handleTogglePreset = (checked: boolean) => {
        const newValue = Boolean(checked);
        setValue(`${basePath}.isPreset`, newValue, { shouldDirty: true });
        onPresetChange?.(newValue);
        if (!newValue && !isUserModified) {
            setLocalValue('');
            setValue(`${basePath}.narrative`, '', { shouldDirty: true });
            onTextChange?.('');
        }
    };
    
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (newValue && !isUserModified) {
            setValue(`${basePath}.userModified`, true, { shouldDirty: true });
            onUserModifiedChange?.(true);
        } else if (!newValue && isUserModified) {
            setValue(`${basePath}.userModified`, false, { shouldDirty: true });
            onUserModifiedChange?.(false);
        }

        onTextChange?.(newValue);
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setValue(`${basePath}.narrative`, e.target.value, { shouldDirty: true });
        trigger(`${basePath}.narrative`);
    }

    
    const CheckboxWithLabel = (
        <div className="flex items-center space-x-2">
            <Checkbox
                id={`preset-${basePath}`}
                checked={isPresetEnabled}
                onCheckedChange={handleTogglePreset}
                disabled={isUserModified}
            />
            <Label htmlFor={`preset-${basePath}`} className="text-sm font-medium">{t('enablePreset')}</Label>
        </div>
    );

    return (
        <div className="space-y-2 border rounded-md p-4">
             <div className="flex justify-between items-center mb-2">
                <Label htmlFor={basePath} className="text-base font-semibold">{label}</Label>
                {isUserModified ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>{CheckboxWithLabel}</TooltipTrigger>
                            <TooltipContent>
                                <p>{t('clearToReenable')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    CheckboxWithLabel
                )}
            </div>

            <Separator />
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 py-2">
                {modifiers.map(mod => (
                     <div key={mod.name} className="flex items-center space-x-2">
                        <Controller
                            name={`${basePath}.modifiers.${mod.name}`}
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id={`${basePath}-${mod.name}`}
                                    checked={field.value}
                                    onCheckedChange={(value) => {
                                        field.onChange(value);
                                        onModifierChange?.(mod.name, Boolean(value));
                                    }}
                                    disabled={isUserModified}
                                />
                            )}
                        />
                         <Label htmlFor={`${basePath}-${mod.name}`}>{mod.label}</Label>
                     </div>
                ))}
            </div>
            {modifiers.map(mod => {
                const enabled = watch(`${basePath}.modifiers.${mod.name}`);
                if (
                    mod.inputGroup &&
                    enabled &&
                    !externalInputGroupNames.includes(mod.name)
                ) {
                    return (
                        <ModifierInputGroup
                            key={`${mod.name}-group`}
                            basePath={`${basePath}.modifierInputs.${mod.name}`}
                            groupConfig={mod.inputGroup}
                        />
                    );
                }
                return null;
            })}
            <Textarea
                value={localValue}
                id={`${basePath}.narrative`}
                placeholder={placeholder}
                className={cn('min-h-[150px]', isInvalid && 'border-red-500 focus-visible:ring-red-500')}
                onChange={handleTextareaChange}
                onBlur={handleBlur}
            />
            {description && <p className="text-xs text-muted-foreground pt-2">{description}</p>}
        </div>
    );
}

export const ModifierInputGroup = ({ basePath, groupConfig }: { basePath: string; groupConfig: any }) => {
    const { control, register, formState: { errors }, getValues, trigger } = useFormContext();
    const t = useScopedI18n('shared.textareaWithPreset');
    const isInvalid = (fieldName: string, required?: boolean) => {
        const parts = fieldName.split('.');
        let error: any = errors;
        for (const part of parts) {
            if (error && part in error) {
                error = error[part];
            } else {
                error = null;
                break;
            }
        }
        if (error) return true;
        if (required) {
            const value = getValues(fieldName);
            return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        }
        return false;
    };
    const { fields, append, remove } = useFieldArray({ control, name: basePath });

    useEffect(() => {
        if (groupConfig.required) {
            register(basePath as any, {
                validate: (value) => (value && value.length > 0) || 'At least one entry is required'
            });
            trigger(basePath as any);
        }
    }, [basePath, groupConfig.required, register, trigger]);

    useEffect(() => {
        if (groupConfig.required) {
            trigger(basePath as any);
        }
    }, [fields, basePath, groupConfig.required, trigger]);

    const groupInvalid = isInvalid(basePath, groupConfig.required);

    if (groupConfig.fields?.some((f: any) => f.type === 'textarea-with-preset')) {
        return <p className="text-red-500">{t('textareaInGroupError')}</p>;
    }

    const renderField = (field: any, path: string) => {
        switch (field.type) {
            case 'text':
                return (
                    <div key={path} className="w-full">
                        <Label htmlFor={path}>{field.label}</Label>
                        <Input id={path} {...register(path, { required: field.required })} placeholder={field.placeholder} className={cn(isInvalid(path, field.required) && 'border-red-500 focus-visible:ring-red-500')} />
                    </div>
                );
            case 'textarea':
                return (
                    <div key={path} className="w-full">
                        <Label htmlFor={path}>{field.label}</Label>
                        <Textarea id={path} {...register(path, { required: field.required })} placeholder={field.placeholder} className={cn(isInvalid(path, field.required) && 'border-red-500 focus-visible:ring-red-500')} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card className={cn('mb-4', groupInvalid && 'border-red-500')}>
            <CardHeader>
                <CardTitle>{groupConfig.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 p-4 border rounded-lg">
                        <div className="flex-1 space-y-4">
                            {groupConfig.fields?.map((sub: any) => renderField(sub, `${basePath}.${index}.${sub.name}`))}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        append(
                            groupConfig.fields?.reduce(
                                (acc: any, f: any) => ({ ...acc, [f.name]: f.defaultValue || '' }),
                                {}
                            ) || {}
                        )
                    }
                >
                    <Plus className="mr-2 h-4 w-4" /> {t('addEntry', { label: groupConfig.label })}
                </Button>
            </CardContent>
        </Card>
    );
};
