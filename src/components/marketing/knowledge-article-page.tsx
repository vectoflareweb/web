import { ArrowRight, BookOpen } from 'lucide-react'
import type { KnowledgeArticle } from '@/product/knowledge'
import { knowledge } from '@/product/knowledge'
import {  useTranslation  } from '@/features/i18n/provider'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { PageHero } from './section-head'
import { JsonLd, articleLd, siteBreadcrumbLd } from '@/features/seo/jsonld'
import { MarketingShell } from './shell'

/**
 * Article renderer for /knowledge/{slug}: intro + numbered sections + related
 * guide + CTA, with Article JSON-LD for question-style informational queries.
 */
export function KnowledgeArticlePage({ article }: { article: KnowledgeArticle }) {
  const { locale, t } = useTranslation()
  const fl = useLocalizePath()
  const articles = knowledge[locale]
  const index = articles.findIndex((a) => a.slug === article.slug)
  const next = index >= 0 && index < articles.length - 1 ? articles[index + 1] : undefined

  return (
    <MarketingShell>
      <PageHero kicker={article.kicker} title={article.h1}>
        <p className="fg-dim mx-auto mt-6 max-w-2xl text-[15.5px] leading-relaxed">{article.intro}</p>
      </PageHero>

      <article className="mx-auto max-w-3xl px-5 py-14 md:px-7 md:py-16">
        <div className="space-y-12">
          {article.sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="flex items-baseline gap-3 font-display text-[21px] font-bold leading-snug md:text-[23px]">
                <span className="bg-gradient-to-br from-primary to-aqua bg-clip-text font-display text-[17px] font-extrabold text-transparent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s.title}
              </h2>
              {s.body.map((p, j) => (
                <p key={j} className="mt-3.5 text-[15px] leading-[1.75] text-fg-2">{p}</p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-border bg-bg-alt p-8 text-center md:p-10">
          <p className="kicker">{t('sup.knowledge.ctaKicker')}</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold">{t('sup.knowledge.ctaTitle')}</h2>
          <a
            href={fl('/contact')}
            className="sun-grad mt-7 inline-flex h-[46px] items-center gap-2 rounded-full px-7 text-[15px] font-bold shadow-[0_10px_30px_-8px_rgba(255,107,53,0.65)] transition-transform hover:-translate-y-px"
          >
            {t('sup.projects.discuss')} <ArrowRight size={17} />
          </a>
        </div>
      </article>

      {/* related guide */}
      {next && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-5 py-12 md:px-7">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-fg-3">
              <BookOpen size={14} className="text-primary" /> {t('sup.knowledge.nextKicker')}
            </p>
            <a
              href={fl(`/knowledge/${next.slug}`)}
              className="group mt-3 block rounded-2xl border border-border bg-bg-alt p-6 transition-transform hover:-translate-y-0.5"
            >
              <h2 className="font-display text-lg font-bold leading-snug group-hover:text-primary">{next.h1}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{next.intro}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary group-hover:underline">
                {t('sup.knowledge.readArticle')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
            <a href={fl('/knowledge')} className="mt-4 inline-block text-[13.5px] font-medium text-primary hover:underline">
              {t('sup.breadcrumb.knowledge')} →
            </a>
          </div>
        </section>
      )}

      <JsonLd
        data={articleLd({
          title: article.h1,
          description: article.metaDescription,
          path: `/knowledge/${article.slug}`,
        })}
      />
      <JsonLd
        data={siteBreadcrumbLd([
          { name: t('sup.breadcrumb.home'), path: '/' },
          { name: t('sup.breadcrumb.knowledge'), path: '/knowledge' },
          { name: article.h1, path: `/knowledge/${article.slug}` },
        ])}
      />
    </MarketingShell>
  )
}
