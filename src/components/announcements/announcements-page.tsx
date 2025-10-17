
'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useScopedI18n } from '@/lib/i18n/client';

type Announcement = {
    id: number;
    date: string;
    title: string;
    content: string;
    button?: {
        text: string;
        href: string;
    }
};

interface AnnouncementsPageProps {
    initialAnnouncements: Announcement[];
}

export function AnnouncementsPage({ initialAnnouncements }: AnnouncementsPageProps) {
    const t = useScopedI18n('announcements');
    const [isClient, setIsClient] = useState(false);

    const sortedAnnouncements = useMemo(() => {
        return [...initialAnnouncements].sort((a, b) => b.id - a.id);
    }, [initialAnnouncements]);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined' && sortedAnnouncements.length > 0) {
            document.title = t('pageTitle');
            const latestId = sortedAnnouncements[0].id;
            localStorage.setItem('last_read_announcement', latestId.toString());
            // This will trigger a re-render in the sidebar nav to update the badge count.
            // A more robust solution might use a shared state or context.
            window.dispatchEvent(new Event('storage'));
        }
    }, [sortedAnnouncements, t]);

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader
                title={t('header.title')}
                description={t('header.description')}
            />

            <div className="space-y-6">
                {sortedAnnouncements.map((announcement) => (
                    <Card key={announcement.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl font-bold">{announcement.title}</CardTitle>
                                    <CardDescription>
                                        {t('postedOn')} {format(new Date(announcement.date), 'PPP')}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary shrink-0">
                                    <Bell className="h-6 w-6" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{announcement.content}</p>
                        </CardContent>
                        {announcement.button && (
                            <CardFooter>
                                <Button asChild>
                                    <Link href={announcement.button.href}>
                                        {announcement.button.text}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
