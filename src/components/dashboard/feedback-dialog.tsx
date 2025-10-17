
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
import { ThumbsUp, ThumbsDown, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useScopedI18n } from '@/lib/i18n/client';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const pathname = usePathname();
  const [feedbackType, setFeedbackType] = React.useState<'positive' | 'negative' | null>(null);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [selectedReasons, setSelectedReasons] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const t = useScopedI18n('feedbackDialog');

  const positiveReasons = [
      { id: 'design', label: t('reasons.positive.design') },
      { id: 'performance', label: t('reasons.positive.performance') },
      { id: 'feature', label: t('reasons.positive.feature') },
      { id: 'helpful', label: t('reasons.positive.helpful') },
  ];
  
  const negativeReasons = [
      { id: 'bug', label: t('reasons.negative.bug') },
      { id: 'slow', label: t('reasons.negative.slow') },
      { id: 'confusing', label: t('reasons.negative.confusing') },
      { id: 'missing', label: t('reasons.negative.missing') },
  ];

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
        setFeedbackType(null);
        setFeedbackText('');
        setSelectedReasons([]);
    }, 300);
  };

  const handleReasonChange = (reasonId: string) => {
    setSelectedReasons(prev => 
        prev.includes(reasonId) 
        ? prev.filter(r => r !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleSubmit = async () => {
    if (!feedbackType) {
        toast({ title: t('toasts.selectType'), variant: 'destructive' });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isPositive: feedbackType === 'positive',
                feedback: feedbackText,
                reasons: selectedReasons,
                pathname: pathname,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit feedback.');
        }
        
        toast({ title: t('toasts.success.title'), description: t('toasts.success.description') });
        handleClose();

    } catch (error) {
        toast({ title: t('toasts.error.title'), description: t('toasts.error.description'), variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const reasons = feedbackType === 'positive' ? positiveReasons : negativeReasons;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex justify-center gap-4">
                <Button 
                    variant={feedbackType === 'positive' ? 'default' : 'outline'}
                    size="icon"
                    className={cn('h-16 w-16 rounded-full transition-all duration-200', feedbackType === 'positive' && 'scale-110 border-2 border-primary')}
                    onClick={() => setFeedbackType('positive')}
                >
                    <ThumbsUp className="h-8 w-8" />
                </Button>
                 <Button 
                    variant={feedbackType === 'negative' ? 'destructive' : 'outline'}
                    size="icon"
                    className={cn('h-16 w-16 rounded-full transition-all duration-200', feedbackType === 'negative' && 'scale-110 border-2 border-destructive')}
                    onClick={() => setFeedbackType('negative')}
                >
                    <ThumbsDown className="h-8 w-8" />
                </Button>
            </div>
          
           {feedbackType && (
             <div className="space-y-4 animate-in fade-in-50 duration-500">
                <div>
                    <Label>{t('reasons.title')}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {reasons.map(reason => (
                            <div key={reason.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`reason-${reason.id}`} 
                                    onCheckedChange={() => handleReasonChange(reason.label)} 
                                />
                                <Label htmlFor={`reason-${reason.id}`} className="text-sm font-normal cursor-pointer">{reason.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <Label htmlFor="feedback-text">
                        {t('additionalThoughts')}
                    </Label>
                    <Textarea
                        id="feedback-text"
                        placeholder={t('additionalThoughtsPlaceholder')}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="mt-2"
                    />
                </div>
            </div>
           )}
        </div>
        <DialogFooter className="sm:justify-between">
            <Button asChild variant="ghost">
                <Link href="/help" onClick={handleClose}>
                    <LifeBuoy className="mr-2" /> {t('help')}
                </Link>
            </Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>{t('cancel')}</Button>
                <Button onClick={handleSubmit} disabled={!feedbackType || isSubmitting}>
                    {isSubmitting ? t('submitting') : t('submit')}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
