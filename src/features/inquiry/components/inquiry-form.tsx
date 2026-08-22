import { useState, useCallback } from 'react'
import { ArrowRight, Check, ChevronDown, FileText, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { dictionaries } from '@/features/i18n/locale'
import { useLocalizePath } from '@/features/i18n/use-localize-path'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useTurnstile } from '@/features/auth/components/turnstile'
import { trackLead } from '@/features/analytics/events'
import { submitInquiry, type SubmitResult } from '../actions'
import { INQUIRY_LIMITS, PROJECT_FILE_ACCEPT, PROJECT_FILE_EXTENSIONS, type InquiryTier } from '../inquiry.shared'

export interface InquiryPrefill {
  /** Product platform name (shown in the notice + board-platform field). */
  name?: string
  sku?: string
  /** SUP product category key, preselected in the category field. */
  category?: string
  /** Project intent label from a CTA deep link (e.g. custom OEM, MOQ planning). */
  intent?: string
}

/**
 * B2B OEM project RFQ form (two steps):
 *   Step 1 — project fit: business type, company, work email, country/market,
 *            product category (pre-filled per landing page), order quantity
 *            range, launch window, project stage.
 *   Step 2 — product brief: role, board platform, construction, customization,
 *            packaging, compliance, documents, annual volume, budget, files, NDA.
 * The server scores the lead (A/B/C); each tier gets a different reply page.
 */
export function InquiryForm({
  turnstileSiteKey,
  prefill,
}: {
  turnstileSiteKey: string | null
  prefill?: InquiryPrefill
}) {
  const { t, locale } = useTranslation()
  const fl = useLocalizePath()
  const { token, widget, reset } = useTurnstile(turnstileSiteKey)

  const [step, setStep] = useState<1 | 2>(1)
  const [busy, setBusy] = useState(false)
  const [doneTier, setDoneTier] = useState<InquiryTier | null>(null)
  const [msg, setMsg] = useState<{ kind: 'err'; text: string } | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<'empty' | 'type' | 'size' | null>(null)
  const [customization, setCustomization] = useState<Record<string, boolean>>({})
  const [docs, setDocs] = useState<Record<string, boolean>>({})
  const [consent, setConsent] = useState(false)

  const toggleKey = useCallback((set: Record<string, boolean>, setter: (v: Record<string, boolean>) => void, value: string) => {
    setter({ ...set, [value]: !set[value] })
  }, [])

  function fileErrorText(reason: 'empty' | 'type' | 'size' | null): string {
    if (reason === 'size') return t('inquiry.fileSize')
    if (reason === 'empty') return t('inquiry.fileEmpty')
    return t('inquiry.fileType')
  }

  function mapResult(r: SubmitResult) {
    if (r.ok) return null
    switch (r.reason) {
      case 'invalid':
        return { kind: 'err' as const, text: t('inquiry.invalid') }
      case 'rate-limited':
        return { kind: 'err' as const, text: t('inquiry.rateLimited') }
      case 'file-empty':
        return { kind: 'err' as const, text: t('inquiry.fileEmpty') }
      case 'file-type':
        return { kind: 'err' as const, text: t('inquiry.fileType') }
      case 'file-size':
        return { kind: 'err' as const, text: t('inquiry.fileSize') }
      default:
        return { kind: 'err' as const, text: t('inquiry.captcha') }
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (step === 1) {
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }
      setStep(2)
      return
    }
    // The file input is optional, so native validation won't catch a bad file —
    // block the POST here so the server never sees an invalid logo.
    if (fileError) {
      setMsg({ kind: 'err', text: fileErrorText(fileError) })
      return
    }
    setBusy(true)
    setMsg(null)
    setFileError(null)
    try {
      const fd = new FormData(form)
      fd.set('turnstileToken', token ?? '')
      fd.set('locale', locale)
      fd.set('customization', Object.keys(customization).filter((k) => customization[k]).join(','))
      fd.set('docs', Object.keys(docs).filter((k) => docs[k]).join(','))
      fd.set('consent', consent ? 'yes' : '')
      const r = await submitInquiry({ data: fd })
      if (r.ok) {
        trackLead(`inquiry:${String(fd.get('category') ?? 'unsure')}`)
        setDoneTier(r.tier)
        form.reset()
        setStep(1)
        setFileName(null)
        setCustomization({})
        setDocs({})
        setConsent(false)
      } else {
        setMsg(mapResult(r))
        if (r.reason !== 'invalid') reset()
      }
    } catch {
      setMsg({ kind: 'err', text: t('inquiry.failed') })
      reset()
    } finally {
      setBusy(false)
    }
  }

  const onFileChange = useCallback((files: FileList | null) => {
    const f = files?.[0]
    if (!f) {
      setFileName(null)
      setFileError(null)
      return
    }
    const ext = f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.') + 1).toLowerCase() : ''
    const okType = (PROJECT_FILE_EXTENSIONS as readonly string[]).includes(ext)
    const okSize = f.size <= INQUIRY_LIMITS.fileMaxBytes
    setFileError(f.size === 0 ? 'empty' : !okType ? 'type' : !okSize ? 'size' : null)
    setFileName(f.name)
  }, [])

  if (doneTier) return <SuccessPanel tier={doneTier} />

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {prefill?.intent && (
        <p className="flex items-center gap-2 rounded-lg border border-primary/25 bg-soft/60 px-3 py-2 text-[12.5px] font-medium text-primary">
          <ArrowRight size={14} className="shrink-0" />
          {t('inquiry.projectStartedFrom')}
          {prefill.intent}
        </p>
      )}
      {prefill?.name && (
        <p className="rounded-lg border border-primary/25 bg-soft/60 px-3 py-2 text-[12.5px] font-medium text-primary">
          {t('inquiry.projectStartedFrom')}{prefill.name}{prefill.sku ? ` (${prefill.sku})` : ''}
        </p>
      )}

      <div className="rounded-xl border border-border bg-bg-alt px-4 py-3">
        <p className="text-[13px] font-bold">{step === 1 ? t('inquiry.step1Title') : t('inquiry.step2Title')}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-2">
          {step === 1 ? t('inquiry.step1Hint') : t('inquiry.step2Hint')}
        </p>
      </div>

      {/* ── Step 1: project fit ── */}
      <fieldset disabled={step === 2} className={step === 2 ? 'hidden' : ''}>
        <legend className="sr-only">{t('inquiry.step1Legend')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <Label htmlFor="inq-type">{t('inquiry.businessType')} <span className="req">*</span></Label>
            <Select id="inq-type" name="businessType" defaultValue="" required autoComplete="off">
              <option value="" disabled>{t('inquiry.businessTypeHint')}</option>
              <option value="brand">{t('inquiry.businessOptions.brand')}</option>
              <option value="retailer">{t('inquiry.businessOptions.retailer')}</option>
              <option value="distributor">{t('inquiry.businessOptions.distributor')}</option>
              <option value="resort">{t('inquiry.businessOptions.resort')}</option>
              <option value="club">{t('inquiry.businessOptions.club')}</option>
              <option value="rental">{t('inquiry.businessOptions.rental')}</option>
              <option value="corporate">{t('inquiry.businessOptions.corporate')}</option>
              <option value="other">{t('inquiry.businessOptions.other')}</option>
            </Select>
          </div>
          <div className="field">
            <Label htmlFor="inq-company">{t('inquiry.company')} <span className="req">*</span></Label>
            <Input id="inq-company" name="company" required minLength={2} maxLength={120} autoComplete="organization" />
            <span className="field-hint">{t('inquiry.companyHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-email">{t('inquiry.email')} <span className="req">*</span></Label>
            <Input id="inq-email" name="email" type="email" required maxLength={200} autoComplete="email" />
            <span className="field-hint">{t('inquiry.emailHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-country">{t('inquiry.country')} <span className="req">*</span></Label>
            <Input id="inq-country" name="country" required maxLength={80} autoComplete="country-name" />
          </div>
          <div className="field">
            <Label htmlFor="inq-market">{t('inquiry.targetMarket')}</Label>
            <Input id="inq-market" name="targetMarket" maxLength={120} placeholder={t('inquiry.targetMarketPlaceholder')} />
            <span className="field-hint">{t('inquiry.targetMarketHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-category">{t('inquiry.category')} <span className="req">*</span></Label>
            <Select id="inq-category" name="category" defaultValue={prefill?.category ?? 'unsure'} required autoComplete="off">
              <option value="all-around">{t('inquiry.categoryOptions.all-around')}</option>
              <option value="race">{t('inquiry.categoryOptions.race')}</option>
              <option value="surf">{t('inquiry.categoryOptions.surf')}</option>
              <option value="touring">{t('inquiry.categoryOptions.touring')}</option>
              <option value="yoga">{t('inquiry.categoryOptions.yoga')}</option>
              <option value="whitewater">{t('inquiry.categoryOptions.whitewater')}</option>
              <option value="fishing">{t('inquiry.categoryOptions.fishing')}</option>
              <option value="kids">{t('inquiry.categoryOptions.kids')}</option>
              <option value="multi">{t('inquiry.categoryOptions.multi')}</option>
              <option value="hard">{t('inquiry.categoryOptions.hard')}</option>
              <option value="accessories">{t('inquiry.categoryOptions.accessories')}</option>
              <option value="multiple">{t('inquiry.categoryOptions.multiple')}</option>
              <option value="unsure">{t('inquiry.categoryOptions.unsure')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.categoryHint')}</span>
          </div>
          <div className="field sm:col-span-2">
            <Label htmlFor="inq-qty">{t('inquiry.quantity')} <span className="req">*</span></Label>
            <Select id="inq-qty" name="quantity" defaultValue="" required autoComplete="off">
              <option value="" disabled>{t('inquiry.selectPlaceholder')}</option>
              <option value="q1-9">{t('inquiry.quantityOptions.q1-9')}</option>
              <option value="q10-49">{t('inquiry.quantityOptions.q10-49')}</option>
              <option value="q50-99">{t('inquiry.quantityOptions.q50-99')}</option>
              <option value="q100-299">{t('inquiry.quantityOptions.q100-299')}</option>
              <option value="q300-499">{t('inquiry.quantityOptions.q300-499')}</option>
              <option value="q500">{t('inquiry.quantityOptions.q500')}</option>
              <option value="unsure">{t('inquiry.quantityOptions.unsure')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.quantityHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-timeline">{t('inquiry.timeline')} <span className="req">*</span></Label>
            <Select id="inq-timeline" name="timeline" defaultValue="" required autoComplete="off">
              <option value="" disabled>{t('inquiry.selectPlaceholder')}</option>
              <option value="now">{t('inquiry.timelineOptions.now')}</option>
              <option value="t1-3mo">{t('inquiry.timelineOptions.t1-3mo')}</option>
              <option value="t3-6mo">{t('inquiry.timelineOptions.t3-6mo')}</option>
              <option value="t6-12mo">{t('inquiry.timelineOptions.t6-12mo')}</option>
              <option value="t12mo+">{t('inquiry.timelineOptions.t12mo+')}</option>
              <option value="unsure">{t('inquiry.timelineOptions.unsure')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.timelineHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-stage">{t('inquiry.projectStage')} <span className="req">*</span></Label>
            <Select id="inq-stage" name="projectStage" defaultValue="" required autoComplete="off">
              <option value="" disabled>{t('inquiry.selectPlaceholder')}</option>
              <option value="ready">{t('inquiry.projectStageOptions.ready')}</option>
              <option value="reviewing">{t('inquiry.projectStageOptions.reviewing')}</option>
              <option value="developing">{t('inquiry.projectStageOptions.developing')}</option>
              <option value="sampling">{t('inquiry.projectStageOptions.sampling')}</option>
              <option value="future">{t('inquiry.projectStageOptions.future')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.projectStageHint')}</span>
          </div>
          <div className="field sm:col-span-2">
            <Label htmlFor="inq-whatsapp">{t('inquiry.whatsapp')}</Label>
            <Input id="inq-whatsapp" name="whatsapp" maxLength={60} autoComplete="tel" placeholder={t('inquiry.whatsappPlaceholder')} />
          </div>
        </div>
        <p className="mt-4 rounded-lg border border-border bg-bg-alt px-3 py-2.5 text-[12.5px] leading-relaxed text-fg-2">
          {t('inquiry.moqNote')}
        </p>
        <Button type="submit" className="mt-4 h-12 w-full rounded-[7px] text-[15px] font-bold">
          {t('inquiry.continue')}
        </Button>
      </fieldset>

      {/* ── Step 2: product brief ── */}
      <fieldset disabled={step === 1} className={step === 1 ? 'hidden' : 'flex flex-col gap-4'}>
        <legend className="sr-only">{t('inquiry.step2Legend')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <Label htmlFor="inq-role">{t('inquiry.role')} <span className="req">*</span></Label>
            <Select id="inq-role" name="role" defaultValue="" required>
              <option value="" disabled>{t('inquiry.selectPlaceholder')}</option>
              <option value="owner">{t('inquiry.roleOptions.owner')}</option>
              <option value="purchasing">{t('inquiry.roleOptions.purchasing')}</option>
              <option value="product">{t('inquiry.roleOptions.product')}</option>
              <option value="designer">{t('inquiry.roleOptions.designer')}</option>
              <option value="operations">{t('inquiry.roleOptions.operations')}</option>
              <option value="other">{t('inquiry.roleOptions.other')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.roleHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-platform">{t('inquiry.boardPlatform')} <span className="req">*</span></Label>
            <Input
              id="inq-platform"
              name="boardPlatform"
              required
              maxLength={120}
              defaultValue={prefill?.name ?? undefined}
              placeholder={t('inquiry.boardPlatformPlaceholder')}
            />
            <span className="field-hint">{t('inquiry.boardPlatformHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-construction">{t('inquiry.construction')} <span className="req">*</span></Label>
            <Select id="inq-construction" name="construction" defaultValue="" required>
              <option value="" disabled>{t('inquiry.selectPlaceholder')}</option>
              <option value="standard">{t('inquiry.constructionOptions.standard')}</option>
              <option value="premium">{t('inquiry.constructionOptions.premium')}</option>
              <option value="rental">{t('inquiry.constructionOptions.rental')}</option>
              <option value="need-rec">{t('inquiry.constructionOptions.need-rec')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.constructionHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-packaging">{t('inquiry.packaging')} <span className="req">*</span></Label>
            <Select id="inq-packaging" name="packaging" defaultValue="" required>
              <option value="" disabled>{t('inquiry.selectPlaceholder')}</option>
              <option value="export">{t('inquiry.packagingOptions.export')}</option>
              <option value="branded">{t('inquiry.packagingOptions.branded')}</option>
              <option value="custom">{t('inquiry.packagingOptions.custom')}</option>
              <option value="mixed">{t('inquiry.packagingOptions.mixed')}</option>
              <option value="not-decided">{t('inquiry.packagingOptions.not-decided')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.packagingHint')}</span>
          </div>
          <div className="field sm:col-span-2">
            <Label>{t('inquiry.customization')} <span className="req">*</span></Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(['logo', 'graphics', 'eva', 'accessories', 'packaging', 'tooling', 'not-sure'] as const).map((v) => (
                <CheckOption
                  key={v}
                  checked={!!customization[v]}
                  onChange={() => toggleKey(customization, setCustomization, v)}
                  label={t(`inquiry.customizationOptions.${v}`)}
                  name="customization"
                  required={!Object.values(customization).some(Boolean)}
                />
              ))}
            </div>
            <span className="field-hint">{t('inquiry.customizationHint')}</span>
          </div>
          <div className="field sm:col-span-2">
            <Label htmlFor="inq-compliance">{t('inquiry.compliance')} <span className="req">*</span></Label>
            <Select id="inq-compliance" name="compliance" defaultValue="" required>
              <option value="" disabled>{t('inquiry.selectPlaceholder')}</option>
              <option value="eu">{t('inquiry.complianceOptions.eu')}</option>
              <option value="uk">{t('inquiry.complianceOptions.uk')}</option>
              <option value="us-ca">{t('inquiry.complianceOptions.us-ca')}</option>
              <option value="au-nz">{t('inquiry.complianceOptions.au-nz')}</option>
              <option value="other">{t('inquiry.complianceOptions.other')}</option>
              <option value="guidance">{t('inquiry.complianceOptions.guidance')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.complianceHint')}</span>
          </div>
          <div className="field sm:col-span-2">
            <Label>{t('inquiry.docs')}</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(['audit', 'declaration', 'test-report', 'labeling', 'inspection', 'not-decided'] as const).map((v) => (
                <CheckOption
                  key={v}
                  checked={!!docs[v]}
                  onChange={() => toggleKey(docs, setDocs, v)}
                  label={t(`inquiry.docsOptions.${v}`)}
                  name="docs"
                />
              ))}
            </div>
            <span className="field-hint">{t('inquiry.docsHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-annual">{t('inquiry.annualVolume')}</Label>
            <Select id="inq-annual" name="annualVolume" defaultValue="not-decided">
              <option value="v50-99">{t('inquiry.annualVolumeOptions.v50-99')}</option>
              <option value="v100-299">{t('inquiry.annualVolumeOptions.v100-299')}</option>
              <option value="v300-999">{t('inquiry.annualVolumeOptions.v300-999')}</option>
              <option value="v1000">{t('inquiry.annualVolumeOptions.v1000')}</option>
              <option value="not-decided">{t('inquiry.annualVolumeOptions.not-decided')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.annualVolumeHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-budget">{t('inquiry.budget')}</Label>
            <Input id="inq-budget" name="budget" maxLength={160} placeholder={t('inquiry.budgetPlaceholder')} />
            <span className="field-hint">{t('inquiry.budgetHint')}</span>
          </div>
          <div className="field">
            <Label htmlFor="inq-website">{t('inquiry.website')}</Label>
            <Input id="inq-website" name="website" maxLength={200} placeholder={t('inquiry.websitePlaceholder')} inputMode="url" autoComplete="url" />
          </div>
          <div className="field">
            <Label htmlFor="inq-logo">{t('inquiry.upload')}</Label>
            <div className="flex items-center gap-3">
              <label className="inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-[7px] border border-dashed border-input px-4 text-sm font-medium text-fg-2 transition-colors hover:border-primary hover:text-foreground">
                <UploadCloud size={16} />
                {fileName ?? t('inquiry.uploadFile')}
                <input
                  id="inq-logo"
                  name="projectFile"
                  type="file"
                  accept={PROJECT_FILE_ACCEPT}
                  className="sr-only"
                  onChange={(e) => onFileChange(e.target.files)}
                />
              </label>
              {fileName && (
                <button
                  type="button"
                  aria-label={t('inquiry.removeFile')}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-3 hover:text-destructive"
                  onClick={() => {
                    setFileName(null)
                    setFileError(null)
                    const input = document.getElementById('inq-logo') as HTMLInputElement | null
                    if (input) input.value = ''
                  }}
                >
                  <X size={14} /> {fileName}
                </button>
              )}
            </div>
            <span className={`field-hint ${fileError ? 'err' : ''}`}>
              {fileError ? fileErrorText(fileError) : t('inquiry.uploadHint')}
            </span>
          </div>
          <div className="field sm:col-span-2">
            <Label htmlFor="inq-req">{t('inquiry.requirements')}</Label>
            <Textarea id="inq-req" name="requirements" rows={4} maxLength={2000} placeholder={t('inquiry.requirementsPlaceholder')} />
          </div>
          <div className="field sm:col-span-2">
            <Label htmlFor="inq-nda">{t('inquiry.nda')} <span className="req">*</span></Label>
            <Select id="inq-nda" name="nda" defaultValue="no" required>
              <option value="yes">{t('inquiry.ndaOptions.yes')}</option>
              <option value="no">{t('inquiry.ndaOptions.no')}</option>
            </Select>
            <span className="field-hint">{t('inquiry.ndaNote')}</span>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-bg-alt px-3 py-3">
          <input
            type="checkbox"
            name="consent"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="text-[12.5px] leading-relaxed text-fg-2">
            {t('inquiry.consent')}{' '}
            <a href={fl('/privacy')} className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {t('inquiry.consentPrivacy')}
            </a>
          </span>
        </label>

        <div className="rounded-xl border border-border bg-bg-alt p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold"><ShieldCheck size={15} className="text-primary" /> {t('inquiry.whatNext')}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-2">{t('inquiry.whatNextBody')}</p>
          <p className="mt-2 border-t border-border pt-2 text-[12px] leading-relaxed text-fg-3">{t('inquiry.privacyNote')}</p>
        </div>

        {widget}
        {msg && <p className="text-sm font-medium text-destructive">{msg.text}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 flex-1 rounded-[7px] text-[15px] font-bold">
            {t('inquiry.back')}
          </Button>
          <Button type="submit" disabled={busy} className="h-12 flex-[2] rounded-[7px] text-[15px] font-bold">
            {busy ? t('inquiry.submitting') : t('inquiry.submit')}
          </Button>
        </div>
        <p className="text-center text-[12px] text-fg-3">{t('inquiry.noObligation')}</p>
      </fieldset>
    </form>
  )
}

/** Tiered post-submit panel (hard-split pricing/SLA messaging per lead grade). */
function SuccessPanel({ tier }: { tier: InquiryTier }) {
  const { t, locale } = useTranslation()
  const fl = useLocalizePath()
  if (tier === 'A') {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
        <p className="flex items-center gap-2 text-[15px] font-bold text-success"><Check size={17} /> {t('inquiry.okA.title')}</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{t('inquiry.okA.body')}</p>
      </div>
    )
  }
  if (tier === 'B') {
    return (
      <div className="rounded-2xl border border-border bg-bg-alt p-6">
        <p className="text-[15px] font-bold"><FileText size={16} className="mr-1.5 inline text-primary" /> {t('inquiry.okB.title')}</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{t('inquiry.okB.body')}</p>
        <p className="mt-4 text-[11.5px] font-bold uppercase tracking-[0.12em] text-fg-3">
          {t('inquiry.oemBriefChecklist')}
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {dictionaries[locale].inquiry.okB.checklist.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[13px] leading-relaxed text-fg-2">
              <Check size={14} className="mt-0.5 shrink-0 text-primary" /> {line}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-border bg-bg-alt p-6">
      <p className="text-[15px] font-bold">{t('inquiry.okC.title')}</p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{t('inquiry.okC.body')}</p>
      <a href={fl('/oem-moq-guide')} className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-5 text-[13px] font-bold text-primary transition-colors hover:bg-primary/10">
        {t('inquiry.okC.guideLink')}
      </a>
    </div>
  )
}

/** Radio-style checkbox row shared by the multi-select groups. */
function CheckOption({
  checked,
  onChange,
  label,
  name,
  required,
}: {
  checked: boolean
  onChange: () => void
  label: string
  name: string
  required?: boolean
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${checked ? 'border-primary/50 bg-primary/5' : 'border-border bg-background hover:border-primary/30'}`}>
      <input type="checkbox" name={name} checked={checked} required={required} onChange={onChange} className="h-4 w-4 accent-primary" />
      <span className="text-[13px] font-medium text-fg-2">{label}</span>
    </label>
  )
}

/** Native select styled to match the app's inputs. */
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="h-[42px] w-full appearance-none rounded-[7px] border border-input bg-background px-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        {props.children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3" />
    </div>
  )
}