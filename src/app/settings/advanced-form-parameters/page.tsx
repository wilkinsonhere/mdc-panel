
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useOfficerStore, Officer } from '@/stores/officer-store';
import { User, IdCard, ShieldEllipsis as ShieldIcon, Plus, Trash2, BookUser } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n, useScopedI18n } from '@/lib/i18n/client';

interface DeptRanks {
  [department: string]: string[];
}

export default function AdvancedFormParametersPage() {
    const { toast } = useToast();
    const { 
        predefinedOfficers,
        updatePredefinedOfficer,
        addPredefinedOfficer,
        removePredefinedOfficer,
        setPredefinedOfficers,
        alternativeCharacters,
        swapOfficer,
    } = useOfficerStore();
    const [deptRanks, setDeptRanks] = useState<DeptRanks>({});
    const { t: tRoot } = useI18n();
    const t = useScopedI18n('settings');

    useEffect(() => {
        document.title = tRoot('settings.advanced.pageTitle');
    }, [tRoot]);

    useEffect(() => {
        setPredefinedOfficers();
        fetch('/data/faction_ranks.json')
          .then((res) => res.json())
          .then((data) => setDeptRanks(data));
    }, [setPredefinedOfficers]);

    const handleSave = () => {
        toast({
          title: 'Settings Saved',
          description: 'Your predefined officer setup has been updated.',
        });
    };
    
    const handlePillClick = (officerToSwap: Officer, altChar: Officer) => {
        swapOfficer(officerToSwap.id, altChar);
    }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader
                title={t('advanced.header.title')}
                description={t('advanced.header.description')}
            />
             <div className="grid gap-8 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('advanced.setup.title')}</CardTitle>
                        <CardDescription>
                            {t('advanced.setup.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {predefinedOfficers.map((officer, index) => (
                            <div key={officer.id} className="p-4 border rounded-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-lg font-medium">{t('advanced.setup.officer', { index: index + 1 })}</Label>
                                    <Button variant="ghost" size="icon" onClick={() => removePredefinedOfficer(officer.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor={`predef-name-${officer.id}`}>{t('defaultOfficer.fields.fullName')}</Label>
                                        <div className="relative flex items-center">
                                            <User className="absolute left-2.5 z-10 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id={`predef-name-${officer.id}`}
                                                value={officer.name}
                                                onChange={(e) => updatePredefinedOfficer(officer.id, { name: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`predef-rank-${officer.id}`}>{t('defaultOfficer.fields.rankAndDept')}</Label>
                                        <div className="relative flex items-center">
                                            <ShieldIcon className="absolute left-2.5 z-10 h-4 w-4 text-muted-foreground" />
                                            <Select
                                                value={officer.department && officer.rank ? `${officer.department}__${officer.rank}` : ''}
                                                onValueChange={(value) => {
                                                    const [department, rank] = value.split('__');
                                                    updatePredefinedOfficer(officer.id, { department, rank });
                                                }}
                                            >
                                                <SelectTrigger id={`predef-rank-${officer.id}`} className="pl-9">
                                                    <SelectValue placeholder={t('defaultOfficer.fields.rankPlaceholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(deptRanks).map(([dept, ranks]) => (
                                                        <SelectGroup key={dept}>
                                                            <SelectLabel>{dept}</SelectLabel>
                                                            {ranks.map((rank) => (
                                                                <SelectItem key={`${dept}-${rank}-${officer.id}`} value={`${dept}__${rank}`}>{rank}</SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`predef-badge-${officer.id}`}>{t('defaultOfficer.fields.badgeNo')}</Label>
                                        <div className="relative flex items-center">
                                            <IdCard className="absolute left-2.5 z-10 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id={`predef-badge-${officer.id}`}
                                                value={officer.badgeNumber}
                                                onChange={(e) => updatePredefinedOfficer(officer.id, { badgeNumber: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`predef-detail-${officer.id}`}>{t('defaultOfficer.fields.divDetail')}</Label>
                                        <div className="relative flex items-center">
                                            <BookUser className="absolute left-2.5 z-10 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id={`predef-detail-${officer.id}`}
                                                value={officer.divDetail || ''}
                                                onChange={(e) => updatePredefinedOfficer(officer.id, { divDetail: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {index === 0 && (
                                     <div className="flex flex-wrap gap-2">
                                        {alternativeCharacters.filter(alt => alt.name).map((altChar) => {
                                            const isSelected = officer.name === altChar.name && officer.badgeNumber === altChar.badgeNumber;
                                            return (
                                                !isSelected && (
                                                    <Badge
                                                        key={altChar.id}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-accent"
                                                        onClick={() => handlePillClick(officer, altChar)}
                                                    >
                                                        {altChar.name}
                                                    </Badge>
                                                )
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button variant="outline" onClick={addPredefinedOfficer}>
                            <Plus className="mr-2 h-4 w-4" /> {t('advanced.setup.addOfficerButton')}
                        </Button>
                    </CardContent>
                </Card>

                 <div className="flex justify-end">
                    <Button onClick={handleSave}>{t('buttons.save')}</Button>
                </div>
            </div>
        </div>
    );
}
