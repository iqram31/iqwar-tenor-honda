// Perhitungan kredit motor dengan sistem bunga FLAT (umum dipakai leasing motor).
//   Pokok hutang  = OTR - DP
//   Total bunga   = Pokok x bunga_flat_per_tahun x (tenor / 12)
//   Angsuran/bln  = (Pokok + Total bunga) / tenor   (dibulatkan ke atas per Rp1.000)

export const TENORS = [11, 17, 23, 29, 35]

// Bunga flat per tahun (persen) per tenor. Dikalibrasi dari contoh simulasi dealer;
// bisa diubah user lewat panel "Pengaturan bunga".
export const DEFAULT_RATES = { 11: 28, 17: 27, 23: 26, 29: 25, 35: 24 }

export const DP_MIN_PCT = 0.05
export const DP_MAX_PCT = 0.8
export const STEP = 100_000

export const roundUp = (n, to = 1000) => Math.ceil(n / to) * to
export const roundStep = (n, to = STEP) => Math.round(n / to) * to

export function installment(otr, dp, tenor, ratePct) {
  const principal = Math.max(otr - dp, 0)
  const interest = principal * (ratePct / 100) * (tenor / 12)
  return roundUp((principal + interest) / tenor)
}

// kebalikannya: berapa DP agar angsuran = target
export function dpForInstallment(otr, target, tenor, ratePct) {
  const factor = 1 + (ratePct / 100) * (tenor / 12)
  return otr - (target * tenor) / factor
}

export function dpBounds(otr) {
  return {
    min: Math.ceil((otr * DP_MIN_PCT) / STEP) * STEP,
    max: Math.floor((otr * DP_MAX_PCT) / STEP) * STEP,
  }
}

export function summary(otr, dp, tenor, ratePct) {
  const principal = Math.max(otr - dp, 0)
  const monthly = installment(otr, dp, tenor, ratePct)
  const totalInstallment = monthly * tenor
  return {
    principal,
    monthly,
    totalInstallment,
    totalInterest: totalInstallment - principal,
    totalPaid: dp + totalInstallment,
  }
}

const idr = new Intl.NumberFormat('id-ID')
export const rupiah = (n) => 'Rp ' + idr.format(Math.round(n))
