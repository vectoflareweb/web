import { SiteNav } from './site-nav'
import { Footer } from './footer'

export function MarketingShell({ children, mainClassName }: { children: React.ReactNode; mainClassName?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main id="main-content" className={mainClassName}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
