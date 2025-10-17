
import { promises as fs } from 'fs';
import path from 'path';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import { getTranslations } from '@/lib/i18n/server';

export async function Footer() {
    const file = await fs.readFile(path.join(process.cwd(), 'data/config.json'), 'utf8');
    const config = JSON.parse(file);
    const { t } = await getTranslations();
    const copyrightYear = `${2025}-${new Date().getFullYear() + 1}`;

    return (
      <footer className="relative z-10 py-4 mt-auto">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2">
            <Image
                src={config.SITE_LOGO}
                width={60}
                height={30}
                alt="MDC Panel Logo"
            />
          <p className="text-center text-sm text-muted-foreground">
            &copy; {copyrightYear} {config.SITE_NAME}. {t('footer.rights')} {t('footer.version')}: <Link href="/changelog" className="hover:text-primary transition-colors">{config.SITE_VERSION}</Link>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link>
              <Separator orientation="vertical" className="h-4" />
              <Link href="/credits" className="hover:text-primary transition-colors">{t('footer.credits')}</Link>
          </div>
        </div>
      </footer>
    );
}
