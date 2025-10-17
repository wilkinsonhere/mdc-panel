
'use client';
import { useRouter } from 'next/navigation';
import { useRef, forwardRef, useImperativeHandle, useEffect, useMemo, useCallback, useState } from 'react';
import { useForm, FormProvider, Controller, useFormContext } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Paperclip,
  Video,
  FileText,
  User,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeneralSection } from '@/components/shared/general-section';
import { OfficerSection } from '@/components/shared/officer-section';
import { useFormStore } from '@/stores/form-store';
import { useOfficerStore } from '@/stores/officer-store';
import { LocationDetails } from '../shared/location-details';
import { useBasicReportModifiersStore, Modifier } from '@/stores/basic-report-modifiers-store';
import { TextareaWithPreset } from '../shared/textarea-with-preset';
import Handlebars from 'handlebars';
import React from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { BasicArrestReportAIDialog } from './basic-arrest-report-ai-dialog';
import { useChargeStore } from '@/stores/charge-store';
import { useScopedI18n } from '@/lib/i18n/client';

/* --------------------------------- Layout -------------------------------- */

const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
      {icon}
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/* ----------------------------- RHF-driven fields ---------------------------- */

const InputField = ({
  label,
  id,
  name,
  placeholder,
  icon,
  type = 'text',
  className = '',
  onBlur,
  isInvalid,
  mandatory = false, // NEW: only show red when true
}: {
  label: string;
  id: string;
  name: string; // react-hook-form path
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  isInvalid?: boolean;
  mandatory?: boolean;
}) => {
  const { register, watch } = useFormContext();
  const value = watch(name);
  const empty = !value || String(value).trim() === '';
  const showRed = mandatory && (isInvalid || empty);

  const reg = register(name);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <div className="absolute left-2.5 z-10">{icon}</div>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className={cn('pl-9', className, showRed && 'border-red-500 focus-visible:ring-red-500')}
          {...reg}
          onBlur={(e) => {
            reg.onBlur(e);
            onBlur?.(e);
          }}
        />
      </div>
    </div>
  );
};

const TextareaField = ({
  label,
  id,
  name,
  placeholder,
  icon,
  description,
  className = '',
  onBlur,
  isInvalid,
  mandatory = false, // NEW: only show red when true
}: {
  label: string;
  id: string;
  name: string; // react-hook-form path
  placeholder: string;
  icon: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  isInvalid?: boolean;
  mandatory?: boolean;
}) => {
  const { register, watch } = useFormContext();
  const value = watch(name);
  const empty = !value || String(value).trim() === '';
  const showRed = mandatory && (isInvalid || empty);

  const reg = register(name);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-3.5">{icon}</div>
        <Textarea
          id={id}
          placeholder={placeholder}
          className={cn('pl-9 pt-3', className, showRed && 'border-red-500 focus-visible:ring-red-500')}
          {...reg}
          onBlur={(e) => {
            reg.onBlur(e);
            onBlur?.(e);
          }}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

/* ------------------------------ Main component ----------------------------- */

type ArrestReportFormHandle = {
  saveDraft: () => void;
};

export const ArrestReportForm = forwardRef<ArrestReportFormHandle>(function ArrestReportForm(_, ref) {
  const router = useRouter();
  const t = useScopedI18n('arrestReport.form');
  const { experimentalFeatures } = useSettingsStore();
  const showAiFeature = experimentalFeatures.includes('ai_arrest_reports');
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const { formData, setFormField, setAll } = useFormStore();
  const { officers } = useOfficerStore();
  const { report, penalCode } = useChargeStore();
  const {
    modifiers,
    presets,
    userModified,
    setModifier,
    setPreset,
    setUserModified,
  } = useBasicReportModifiersStore();

  const methods = useForm({
    defaultValues: useMemo(
      () => ({
        ...formData,
        narrative: {
          modifiers: modifiers,
          isPreset: presets.narrative,
          userModified: userModified.narrative,
          narrative: formData.arrest.narrative,
        },
      }),
      [formData, modifiers, presets, userModified]
    ),
  });

  const {
    control,
    getValues,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    reset(
      {
        ...formData,
        narrative: {
          modifiers: modifiers,
          isPreset: presets.narrative,
          userModified: userModified.narrative,
          narrative: formData.arrest.narrative,
        },
      },
      {
        keepDirty: true,
        keepDirtyValues: true,
        keepTouched: true,
      }
    );
  }, [formData, modifiers, presets, userModified, reset]);

  const formRef = useRef<HTMLFormElement>(null);
  const allWatchedFields = watch();

  const arrestReportModifiers: Modifier[] = useMemo(
    () => [
      { name: 'callOfService', label: t('modifiers.callOfService.label'), text: t('modifiers.callOfService.text') },
      {
        name: 'evaded',
        label: t('modifiers.evaded.label'),
        text: t('modifiers.evaded.text'),
      },
      {
        name: 'resistedArrest',
        label: t('modifiers.resistedArrest.label'),
        text: t('modifiers.resistedArrest.text'),
      },
      {
        name: 'searched',
        label: t('modifiers.searched.label'),
        text: t('modifiers.searched.text'),
      },
      {
        name: 'booking',
        label: t('modifiers.booking.label'),
        text: t('modifiers.booking.text'),
      },
    ],
    [t]
  );

  const narrativeText = useMemo(() => {
    const isPresetActive = allWatchedFields.narrative?.isPreset;
    const isUserModified = userModified.narrative;

    if (!isPresetActive || isUserModified) {
        return getValues('arrest.narrative') || '';
    }

    const primaryOfficer = officers[0];
    const data = {
        date: allWatchedFields.general?.date || '',
        time: allWatchedFields.general?.time || '',
        callsign: allWatchedFields.general?.callSign || '',
        street: allWatchedFields.location?.street || '',
        suspect: allWatchedFields.arrest?.suspectName || formData.arrest?.suspectName || '',
        rank: primaryOfficer?.rank || '',
        name: primaryOfficer?.name || '',
        badge: primaryOfficer?.badgeNumber || '',
        department: primaryOfficer?.department || '',
    };
    
    let baseText = t('narrative.base', data);

    const modifierOrder: (keyof typeof allWatchedFields.narrative.modifiers)[] = ['callOfService', 'evaded', 'resistedArrest', 'searched', 'booking'];
    let firstModifierAdded = false;
    
    modifierOrder.forEach((modName) => {
        if (allWatchedFields.narrative?.modifiers?.[modName]) {
            const modifier = arrestReportModifiers.find(m => m.name === modName);
            if (modifier?.text) {
                const template = Handlebars.compile(modifier.text, { noEscape: true });
                const modifierText = template(data);

                if(modName === 'callOfService' && !firstModifierAdded) {
                     baseText += modifierText;
                } else {
                     baseText += `\n\n${modifierText}`;
                }
                firstModifierAdded = true;
            }
        }
    });

    return baseText;
  }, [
    allWatchedFields.general,
    allWatchedFields.location,
    allWatchedFields.arrest?.suspectName,
    allWatchedFields.narrative?.isPreset,
    JSON.stringify(allWatchedFields.narrative?.modifiers),
    officers,
    arrestReportModifiers,
    getValues,
    userModified.narrative,
    formData.arrest?.suspectName,
    t
]);

  const isInvalid = (fieldName: string) => {
    const fields = fieldName.split('.');
    let error: any = errors;
    for (const field of fields) {
      if (error && field in error) {
        error = (error as any)[field];
      } else {
        return false;
      }
    }
    return !!error;
  };

  const saveDraft = useCallback(() => {
    const latestFormData = getValues();
    const currentOfficerState = useOfficerStore.getState().officers;
    const currentFormData = useFormStore.getState().formData;

    setAll({
      general: latestFormData.general,
      arrest: { ...currentFormData.arrest, narrative: latestFormData.narrative.narrative },
      location: latestFormData.location,
      evidence: currentFormData.evidence,
      officers: currentOfficerState,
    });

    if (latestFormData.narrative?.modifiers) {
      Object.keys(latestFormData.narrative.modifiers).forEach((key) => {
        setModifier(key as keyof typeof modifiers, latestFormData.narrative.modifiers[key]);
      });
    }
    if (latestFormData.narrative?.isPreset !== undefined) {
      setPreset('narrative', latestFormData.narrative.isPreset);
    }
    if (latestFormData.narrative?.userModified !== undefined) {
      setUserModified('narrative', latestFormData.narrative.userModified);
    }
  }, [getValues, setAll, setModifier, setPreset, setUserModified, modifiers]);

  useImperativeHandle(ref, () => ({
    saveDraft,
  }));

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const currentOfficerState = useOfficerStore.getState().officers;
    if (currentOfficerState.every((o) => o.name && o.rank && o.badgeNumber)) {
      saveDraft();
      router.push('/arrest-submit?type=basic');
    }
  };
  
  const handleNarrativeGenerated = ({ narrative }: { narrative: string }) => {
    setValue('arrest.narrative', narrative, { shouldDirty: true });
    
    reset({
        ...getValues(),
        arrest: { ...getValues('arrest'), narrative },
        narrative: {
            ...getValues('narrative'),
            narrative: narrative,
            userModified: true,
        }
    });

    setFormField('arrest', 'narrative', narrative);
    setUserModified('narrative', true);
  };


  return (
    <FormProvider {...methods}>
        {showAiFeature && (
            <BasicArrestReportAIDialog
                open={isAiDialogOpen}
                onOpenChange={setIsAiDialogOpen}
                onNarrativeGenerated={handleNarrativeGenerated}
                context={{
                    charges: report,
                    penalCode: penalCode,
                    ...formData,
                    officers: officers
                }}
            />
        )}
      <form ref={formRef} onSubmit={handleSubmitForm} onBlur={saveDraft} className="space-y-6">
        <GeneralSection />
        <OfficerSection isArrestReport={true} showBadgeNumber={true} />

        <FormSection title={t('sections.location.title')} icon={<MapPin className="h-6 w-6" />}>
          <LocationDetails
            districtFieldName="location.district"
            streetFieldName="location.street"
            showDistrict={true}
          />
        </FormSection>

        <FormSection title={t('sections.arrest.title')} icon={<FileText className="h-6 w-6" />}>
          <div className="space-y-6">
            <InputField
              label={t('fields.suspectName.label')}
              id="suspect-name"
              name="arrest.suspectName"
              placeholder={t('fields.suspectName.placeholder')}
              icon={<User className="h-4 w-4 text-muted-foreground" />}
              onBlur={(e) => setFormField('arrest', 'suspectName', e.target.value)}
              isInvalid={isInvalid('arrest.suspectName')}
              mandatory
            />
            <Controller
              name="narrative"
              control={control}
              render={() => (
                <TextareaWithPreset
                  label={t('fields.narrative.label')}
                  placeholder={t('fields.narrative.placeholder')}
                  description={
                    <span className="text-red-500">
                      {t('fields.narrative.description')}
                    </span>
                  }
                  basePath="narrative"
                  control={control}
                  modifiers={arrestReportModifiers}
                  isInvalid={isInvalid('arrest.narrative')}
                  presetValue={narrativeText}
                  onTextChange={(newValue) => {
                    setFormField('arrest', 'narrative', newValue);
                  }}
                  onUserModifiedChange={(value) => setUserModified('narrative', value)}
                  onModifierChange={(name, value) => setModifier(name, value)}
                  onPresetChange={(value) => setPreset('narrative', value)}
                />
              )}
            />
            {showAiFeature && (
                <div className="flex justify-start">
                    <Button type="button" variant="outline" onClick={() => setIsAiDialogOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('buttons.generateAi')}
                    </Button>
                </div>
            )}
          </div>
        </FormSection>

        <FormSection title={t('sections.evidence.title')} icon={<Paperclip className="h-6 w-6" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TextareaField
              label={t('fields.supportingEvidence.label')}
              id="supporting-evidence"
              name="evidence.supporting"
              placeholder={t('fields.supportingEvidence.placeholder')}
              icon={<Paperclip className="h-4 w-4 text-muted-foreground" />}
              description={t('fields.supportingEvidence.description')}
              className="min-h-[150px]"
              onBlur={(e) => setFormField('evidence', 'supporting', e.target.value)}
              /* NOT mandatory */
            />
            <TextareaField
              label={t('fields.dashcam.label')}
              id="dashcam"
              name="evidence.dashcam"
              placeholder={t('fields.dashcam.placeholder')}
              icon={<Video className="h-4 w-4 text-muted-foreground" />}
              description={
                <span>
                  {t('fields.dashcam.description.main')}
                  <br />
                  <span className="text-red-500">{t('fields.dashcam.description.warning')}</span>
                </span>
              }
              className="min-h-[150px]"
              onBlur={(e) => setFormField('evidence', 'dashcam', e.target.value)}
              isInvalid={isInvalid('evidence.dashcam')}
              mandatory
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={saveDraft}>
            {t('buttons.saveDraft')}
          </Button>
          <Button type="submit">{t('buttons.submit')}</Button>
        </div>
      </form>
    </FormProvider>
  );
});

ArrestReportForm.displayName = 'ArrestReportForm';
