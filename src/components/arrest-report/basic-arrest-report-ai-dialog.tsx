
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { generateBasicArrestNarrativeFlow } from '@/ai/flows/basic-arrest-report-narrative';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';
import { Officer } from '@/stores/officer-store';
import { SelectedCharge, PenalCode } from '@/stores/charge-store';
import { useScopedI18n } from '@/lib/i18n/client';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNarrativeGenerated: (narratives: { narrative: string }) => void;
  context: {
    officers: Officer[];
    charges: SelectedCharge[];
    penalCode: PenalCode | null;
    general: { date: string; time: string; callSign: string };
    arrest: { suspectName: string };
    location: { district: string; street: string };
  };
}

export function BasicArrestReportAIDialog({ open, onOpenChange, onNarrativeGenerated, context }: DialogProps) {
  const [logs, setLogs] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useScopedI18n('aiDialog');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logs.trim()) return;

    setIsLoading(true);
    setError(null);

    const primaryOfficer = context.officers[0];
    const chargeDescriptions = context.charges.map(c => {
        const details = context.penalCode?.[c.chargeId!];
        if (!details) return 'Unknown Charge';
        return `${details.type}${c.class} ${details.id}. ${details.charge}`;
    });
    
    try {
      const flowResult = await generateBasicArrestNarrativeFlow({
        logs,
        officerName: primaryOfficer.name,
        officerBadge: primaryOfficer.badgeNumber,
        officerDepartment: primaryOfficer.department,
        officerCallsign: context.general.callSign,
        suspectName: context.arrest.suspectName,
        charges: chargeDescriptions,
        location: `${context.location.street}, ${context.location.district}`,
        date: context.general.date,
        time: context.general.time,
      });
      onNarrativeGenerated(flowResult);
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setLogs('');
      setIsLoading(false);
      setError(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('disclaimer.title')}</AlertTitle>
            <AlertDescription>
              {t('disclaimer.description')}
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ai-logs">{t('logsLabel')}</Label>
                <Textarea
                    id="ai-logs"
                    value={logs}
                    onChange={(e) => setLogs(e.target.value)}
                    placeholder={t('logsPlaceholder')}
                    disabled={isLoading}
                    rows={10}
                />
            </div>
          </form>

          {isLoading && <Skeleton className="h-10 w-full" />}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('error.title')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={handleClose}>{t('buttons.cancel')}</Button>
            <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || !logs.trim()}
            >
                {isLoading ? t('buttons.generating') : t('buttons.generate')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
