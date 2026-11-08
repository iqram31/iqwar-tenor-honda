import { useEffect, useMemo, useState } from 'react'
import motors from './data/motors.json'
import {
  TENORS, DEFAULT_RATES, STEP,
  installment, dpForInstallment, dpBounds, summary, roundStep, rupiah,
} from './credit.js'

const CATEGORY_ORDER = ['Matic', 'Cub', 'Sport', 'EV']
const minPrice = (m) => Math.min(...m.variants.map((v) => v.price))
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi)
const defaultDp = (otr) => {
  const { min, max } = dpBounds(otr)
  return clamp(roundStep(otr * 0.2), min, max)
}

export default function App() {
  const [slug, setSlug] = useState(() => (motors.some((m) => m.slug === 'pcx') ? 'pcx' : motors[0].slug))
  const [variantIdx, setVariantIdx] = useState(0)
  const [colorIdx, setColorIdx] = useState(0)
  const [tenor, setTenor] = useState(23)
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showRates, setShowRates] = useState(false)

  const motor = motors.find((m) => m.slug === slug)
  const variant = motor.variants[variantIdx] ?? motor.variants[0]
  const otr = variant.price
  const { min: dpMin, max: dpMax } = dpBounds(otr)
  const [dp, setDp] = useState(() => defaultDp(otr))

  // reset DP saat harga OTR berubah (ganti motor / tipe)
  useEffect(() => { setDp(defaultDp(otr)) }, [otr])

  const rate = rates[tenor]
  const s = summary(otr, dp, tenor, rate)
  const instMin = installment(otr, dpMax, tenor, rate)
  const instMax = installment(otr, dpMin, tenor, rate)

  const onInstallmentChange = (target) => {
    setDp(clamp(roundStep(dpForInstallment(otr, target, tenor, rate)), dpMin, dpMax))
  }

  const pickMotor = (m) => {
    setSlug(m.slug)
    setVariantIdx(0)
    setColorIdx(0)
    setPickerOpen(false)
  }

  const color = motor.colors[colorIdx]
  const image = color?.image || motor.thumbnail

  const shareText = encodeURIComponent(
    `Simulasi kredit ${variant.name}${color ? ` (${color.name})` : ''}\n` +
    `Harga OTR: ${rupiah(otr)}\nDP: ${rupiah(dp)}\nTenor: ${tenor} bulan\n` +
    `Angsuran: ${rupiah(s.monthly)}/bulan\n\n*Estimasi, bukan penawaran resmi.`,
  )

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>H</span>
          <div>
            <h1>Simulasi Kredit Motor Honda</h1>
            <p>Harga OTR dari astra-honda.com · hitung DP, tenor &amp; angsuran</p>
          </div>
        </div>
      </header>

      <main className="layout">
        {/* ================= KIRI: MOTOR ================= */}
        <section className="card motor-card">
          <div className="row between">
            <button className="select-motor" onClick={() => setPickerOpen(true)}>
              <SearchIcon /> Pilih motormu
            </button>
            <button className="btn primary" onClick={() => setPickerOpen(true)}>Ganti motor</button>
          </div>

          <p className="eyebrow">HONDA · {motor.category}</p>
          <h2 className="motor-name">{variant.name}</h2>
          <p className="otr">Harga OTR <strong>{rupiah(otr)}</strong></p>

          <div className="hero">
            <img src={image} alt={`${motor.name} ${color?.name ?? ''}`} />
          </div>

          {motor.variants.length > 1 && (
            <>
              <p className="label">Pilihan tipe</p>
              <div className="chips">
                {motor.variants.map((v, i) => (
                  <button
                    key={v.name}
                    className={`chip ${i === variantIdx ? 'active' : ''}`}
                    onClick={() => setVariantIdx(i)}
                  >
                    <span>{v.name}</span>
                    <small>{rupiah(v.price)}</small>
                  </button>
                ))}
              </div>
            </>
          )}

          {motor.colors.length > 0 && (
            <>
              <p className="label">Pilihan warna · <span className="muted">{color?.name}</span></p>
              <div className="swatches">
                {motor.colors.map((c, i) => (
                  <button
                    key={c.name + i}
                    className={`swatch ${i === colorIdx ? 'active' : ''}`}
                    onClick={() => setColorIdx(i)}
                    title={c.name}
                  >
                    <img src={c.image} alt={c.name} loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ================= KANAN: CICILAN ================= */}
        <section className="card plan-card">
          <h3 className="section-title">Atur cicilanmu</h3>

          <div className="field">
            <div className="row between">
              <span className="label">Uang muka (DP)</span>
              <span className="muted small">{((dp / otr) * 100).toFixed(1)}% dari OTR</span>
            </div>
            <MoneyInput value={dp} min={dpMin} max={dpMax} onChange={setDp} />
            <Slider value={dp} min={dpMin} max={dpMax} step={STEP} onChange={setDp} />
            <div className="row between muted small">
              <span>{rupiah(dpMin)}</span><span>{rupiah(dpMax)}</span>
            </div>
          </div>

          <div className="field">
            <span className="label">Angsuran per bulan</span>
            <div className="big">{rupiah(s.monthly)} <small>/bulan</small></div>
            <Slider
              value={s.monthly}
              min={instMin}
              max={instMax}
              step={1000}
              onChange={onInstallmentChange}
            />
            <div className="row between muted small">
              <span>{rupiah(instMin)}</span><span>{rupiah(instMax)}</span>
            </div>
          </div>

          <div className="field">
            <div className="row between">
              <span className="label">Tenor dan angsuran</span>
              <span className="muted small">DP dasar {rupiah(dp)}</span>
            </div>
            <div className="tenors">
              {TENORS.map((t) => (
                <button
                  key={t}
                  className={`tenor ${t === tenor ? 'active' : ''}`}
                  onClick={() => setTenor(t)}
                >
                  <span>{t} bulan</span>
                  <strong>{rupiah(installment(otr, dp, t, rates[t]))}</strong>
                  <small>/bulan</small>
                </button>
              ))}
            </div>
          </div>

          <div className="summary">
            <h4>Ringkasan</h4>
            <dl>
              <dt>Harga OTR</dt><dd>{rupiah(otr)}</dd>
              <dt>Uang muka (DP)</dt><dd>{rupiah(dp)}</dd>
              <dt>Pokok hutang</dt><dd>{rupiah(s.principal)}</dd>
              <dt>Bunga flat</dt><dd>{rate}% / tahun</dd>
              <dt>Total bunga</dt><dd>{rupiah(s.totalInterest)}</dd>
              <dt>Total angsuran ({tenor}×)</dt><dd>{rupiah(s.totalInstallment)}</dd>
              <dt className="strong">Total dibayar</dt><dd className="strong">{rupiah(s.totalPaid)}</dd>
            </dl>
            <a
              className="btn wa"
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noreferrer"
            >
              Bagikan via WhatsApp
            </a>
          </div>

          <button className="link" onClick={() => setShowRates((v) => !v)}>
            {showRates ? 'Tutup' : 'Atur'} pengaturan bunga
          </button>
          {showRates && (
            <div className="rates">
              {TENORS.map((t) => (
                <label key={t}>
                  <span>{t} bln</span>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="0.1"
                    value={rates[t]}
                    onChange={(e) => setRates({ ...rates, [t]: Math.max(0, Number(e.target.value) || 0) })}
                  />
                  <span className="muted">%/thn</span>
                </label>
              ))}
              <button className="btn ghost" onClick={() => setRates(DEFAULT_RATES)}>Reset</button>
            </div>
          )}

          <p className="disclaimer">
            *Hasil simulasi adalah estimasi dengan bunga flat. Angsuran sebenarnya bisa berbeda
            tergantung leasing, wilayah, asuransi, biaya admin, dan promo dealer.
          </p>
        </section>
      </main>

      {pickerOpen && <MotorPicker current={slug} onPick={pickMotor} onClose={() => setPickerOpen(false)} />}

      <footer className="footer">
        Data harga OTR diambil dari situs resmi PT Astra Honda Motor. Aplikasi ini tidak berafiliasi dengan AHM.
      </footer>
    </div>
  )
}

function Slider({ value, min, max, step, onChange }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <div className="slider">
      <button className="step" aria-label="Kurangi" onClick={() => onChange(clamp(value - step * (step < STEP ? 10 : 1), min, max))}>−</button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        style={{ '--pct': `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <button className="step" aria-label="Tambah" onClick={() => onChange(clamp(value + step * (step < STEP ? 10 : 1), min, max))}>+</button>
    </div>
  )
}

function MoneyInput({ value, min, max, onChange }) {
  const [text, setText] = useState(null)
  const shown = text ?? new Intl.NumberFormat('id-ID').format(value)
  const commit = () => {
    if (text == null) return
    const n = Number(text.replace(/\D/g, ''))
    if (n) onChange(clamp(n, min, max))
    setText(null)
  }
  return (
    <div className="money">
      <span>Rp</span>
      <input
        inputMode="numeric"
        value={shown}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Uang muka"
      />
    </div>
  )
}

function MotorPicker({ current, onPick, onClose }) {
  const [cat, setCat] = useState('Semua')
  const [q, setQ] = useState('')
  const cats = useMemo(
    () => ['Semua', ...CATEGORY_ORDER.filter((c) => motors.some((m) => m.category === c))],
    [],
  )
  const list = motors
    .filter((m) => cat === 'Semua' || m.category === cat)
    .filter((m) => (m.name + ' ' + m.variants.map((v) => v.name).join(' ')).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => minPrice(a) - minPrice(b))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pilih motor">
        <div className="row between">
          <h3 className="section-title">Pilih motor</h3>
          <button className="close" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <input
          className="search"
          placeholder="Cari motor, mis. Vario, PCX, BeAT…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div className="tabs">
          {cats.map((c) => (
            <button key={c} className={`tab ${c === cat ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="grid">
          {list.map((m) => (
            <button key={m.slug} className={`pick ${m.slug === current ? 'active' : ''}`} onClick={() => onPick(m)}>
              <img src={m.thumbnail} alt={m.name} loading="lazy" />
              <span className="pick-name">{m.name}</span>
              <span className="muted small">Mulai {rupiah(minPrice(m))}</span>
            </button>
          ))}
          {list.length === 0 && <p className="muted">Motor tidak ditemukan.</p>}
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  )
}
