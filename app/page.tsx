'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, BarChart3, Check, ChevronDown, CircleHelp, Euro, Leaf, Printer, RotateCcw, Settings2, Sprout, TrendingUp, Zap } from 'lucide-react'

type RevenueModel = 'power' | 'biomethane' | 'combined'
type Scenario = 'basis' | 'optimistic' | 'pessimistic'

type Inputs = {
  investment: number
  feedstock: number
  runtime: number
  electricity: number
  heat: number
  biomethane: number
  electricityPrice: number
  heatPrice: number
  biomethanePrice: number
  operatingCosts: number
}

const initialInputs: Inputs = {
  investment: 1850000,
  feedstock: 9200,
  runtime: 8200,
  electricity: 850,
  heat: 1100,
  biomethane: 0,
  electricityPrice: 0.19,
  heatPrice: 0.065,
  biomethanePrice: 0.78,
  operatingCosts: 168000,
}

const scenarioFactors: Record<Scenario, { revenue: number; costs: number; label: string; note: string }> = {
  basis: { revenue: 1, costs: 1, label: 'Basis', note: 'Aktuelle Annahmen' },
  optimistic: { revenue: 1.12, costs: 0.95, label: 'Optimistisch', note: '+12 % Erlöse · −5 % Kosten' },
  pessimistic: { revenue: 0.86, costs: 1.1, label: 'Pessimistisch', note: '−14 % Erlöse · +10 % Kosten' },
}

const money = (value: number, digits = 0) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
const number = (value: number, digits = 0) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
const compact = (value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(2).replace('.', ',')} Mio.` : `${Math.round(value / 1000)} Tsd.`

function Field({ label, value, suffix, onChange, step = 1 }: { label: string; value: number; suffix: string; onChange: (value: number) => void; step?: number }) {
  return <label className="field">
    <span>{label}</span>
    <span className="field-control"><input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} /><b>{suffix}</b></span>
  </label>
}

function MiniChart({ cashflow, investment }: { cashflow: number; investment: number }) {
  const years = Array.from({ length: 11 }, (_, index) => index)
  const values = years.map((year) => Math.min(investment * 1.25, year * cashflow))
  const max = Math.max(investment * 1.15, cashflow * 10, 1)
  const points = values.map((value, index) => `${(index / 10) * 100},${100 - (value / max) * 82}`).join(' ')
  return <div className="chart-wrap">
    <div className="chart-grid"><span>1,5 Mio.</span><span>1,0 Mio.</span><span>0,5 Mio.</span><span>0</span></div>
    <svg className="chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Kumulativer Rückfluss über zehn Jahre">
      <path d={`M 0 100 L ${points} L 100 100 Z`} className="chart-area" />
      <polyline points={points} className="chart-line" />
      <line x1="0" y1={100 - Math.min(82, (investment / max) * 82)} x2="100" y2={100 - Math.min(82, (investment / max) * 82)} className="chart-target" />
    </svg>
    <div className="chart-labels"><span>Jahr 0</span><span>5</span><span>10</span></div>
  </div>
}

export default function Page() {
  const [inputs, setInputs] = useState(initialInputs)
  const [model, setModel] = useState<RevenueModel>('power')
  const [scenario, setScenario] = useState<Scenario>('basis')
  const factor = scenarioFactors[scenario]
  const update = (key: keyof Inputs) => (value: number) => setInputs((current) => ({ ...current, [key]: value }))

  const result = useMemo(() => {
    const power = model === 'biomethane' ? 0 : inputs.electricity * inputs.runtime * inputs.electricityPrice
    const heat = model === 'biomethane' ? 0 : inputs.heat * inputs.runtime * inputs.heatPrice
    const gas = model === 'power' ? 0 : Math.max(inputs.biomethane, 1) * inputs.runtime * inputs.biomethanePrice
    const revenue = (power + heat + gas) * factor.revenue
    const costs = inputs.operatingCosts * factor.costs
    const cashflow = revenue - costs
    const payback = cashflow > 0 ? inputs.investment / cashflow : null
    return { power, heat, gas, revenue, costs, cashflow, payback, roi: (cashflow / Math.max(inputs.investment, 1)) * 100 }
  }, [factor.costs, factor.revenue, inputs, model])

  const setModelAndDefaults = (next: RevenueModel) => {
    setModel(next)
    if (next === 'biomethane') setInputs((current) => ({ ...current, biomethane: current.biomethane || 520 }))
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Leaf /></span><span>Biogas<span>Plan</span></span><em>WIRTSCHAFTSRECHNER</em></div>
      <div className="header-actions"><span className="status-dot" /> Planung · Demoanlage <button className="icon-button" onClick={() => setInputs(initialInputs)} aria-label="Eingaben zurücksetzen"><RotateCcw /></button><button className="print-button" onClick={() => window.print()}><Printer data-icon="inline-start" /> Drucken</button></div>
    </header>

    <section className="intro"><div><p className="eyebrow"><Sprout /> INVESTITIONSENTSCHEIDUNG</p><h1>Wirtschaftlichkeit,<br /><i>die aufgeht.</i></h1><p className="intro-copy">Plane deine Biogasanlage mit realistischen Annahmen und sehe sofort, wann sich deine Investition amortisiert.</p></div><div className="intro-note"><span>AKTUALISIERT</span><strong>21. August 2026</strong><small>Alle Werte sind überschlägig und netto.</small></div></section>

    <div className="workspace">
      <section className="inputs-column">
        <div className="section-heading"><div><span className="section-kicker">01 / PLANUNG</span><h2>Deine Anlage</h2></div><button className="reset-link" onClick={() => setInputs(initialInputs)}><RotateCcw /> Werte zurücksetzen</button></div>
        <div className="card form-card">
          <div className="card-title"><span className="step-icon"><Settings2 /></span><div><h3>Grunddaten</h3><p>Technische Eckdaten deiner Anlage</p></div></div>
          <div className="field-grid"><Field label="Investitionssumme" value={inputs.investment} suffix="€" onChange={update('investment')} /><Field label="Substratmenge pro Jahr" value={inputs.feedstock} suffix="t/Jahr" onChange={update('feedstock')} /><Field label="Volllaststunden" value={inputs.runtime} suffix="h/Jahr" onChange={update('runtime')} /></div>
        </div>
        <div className="section-heading revenue-heading"><div><span className="section-kicker">02 / ERLÖSMODELL</span><h2>Deine Einnahmen</h2></div></div>
        <div className="card form-card">
          <div className="model-tabs" role="tablist">{([['power', 'Strom + Wärme'], ['biomethane', 'Biomethan'], ['combined', 'Kombiniert']] as [RevenueModel, string][]).map(([key, label]) => <button key={key} role="tab" aria-selected={model === key} className={model === key ? 'active' : ''} onClick={() => setModelAndDefaults(key)}>{label}</button>)}</div>
          <div className="field-grid"><Field label="Stromproduktion" value={inputs.electricity} suffix="kW el." onChange={update('electricity')} /><Field label="Wärmenutzung" value={inputs.heat} suffix="kW th." onChange={update('heat')} /><Field label="Biomethanproduktion" value={inputs.biomethane} suffix="Nm³/h" onChange={update('biomethane')} /><Field label="Strompreis / Vergütung" value={inputs.electricityPrice} suffix="€/kWh" step={0.01} onChange={update('electricityPrice')} /><Field label="Wärmepreis" value={inputs.heatPrice} suffix="€/kWh" step={0.005} onChange={update('heatPrice')} /><Field label="Biomethanpreis" value={inputs.biomethanePrice} suffix="€/Nm³" step={0.01} onChange={update('biomethanePrice')} /></div>
        </div>
        <div className="section-heading revenue-heading"><div><span className="section-kicker">03 / KOSTEN</span><h2>Laufender Betrieb</h2></div></div>
        <div className="card form-card"><div className="card-title"><span className="step-icon"><Euro /></span><div><h3>Betriebskosten</h3><p>Personal, Wartung, Substrate und Versicherung</p></div></div><Field label="Jährliche Betriebskosten" value={inputs.operatingCosts} suffix="€/Jahr" onChange={update('operatingCosts')} /></div>
        <div className="assumption"><CircleHelp /><p><strong>Hinweis zur Berechnung</strong><br />Die einfache Amortisationszeit berücksichtigt keine Finanzierung, Steuern, Abschreibung oder Inflation. Für eine Investitionsentscheidung bitte eine Detailplanung erstellen.</p></div>
      </section>

      <aside className="results-column">
        <div className="result-topline"><span className="section-kicker">ERGEBNISÜBERSICHT</span><div className="scenario-select"><span>Szenario</span><select value={scenario} onChange={(event) => setScenario(event.target.value as Scenario)}>{Object.entries(scenarioFactors).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select><ChevronDown /></div></div>
        <div className="card hero-result"><div className="hero-result-label"><span className="success-pill"><Check /> GUTE AUSSICHT</span><span>EINFACHE AMORTISATION</span></div><div className="payback">{result.payback ? result.payback.toFixed(1).replace('.', ',') : '—'} <small>Jahre</small></div><p>bis die Investition zurückverdient ist</p><div className="payback-bar"><span style={{ width: `${Math.min(100, (result.payback || 20) / 12 * 100)}%` }} /></div><div className="bar-labels"><span>Investition</span><span>{result.payback ? `${result.payback.toFixed(1).replace('.', ',')} Jahre` : 'nicht erreicht'}</span></div></div>
        <div className="metrics"><div className="metric"><span>Jahresumsatz</span><strong>{money(result.revenue)}</strong><small>vor Kosten</small></div><div className="metric"><span>Netto-Cashflow</span><strong>{money(result.cashflow)}</strong><small>pro Jahr</small></div><div className="metric"><span>Renditeindikator</span><strong>{number(result.roi, 1)} %</strong><small>Cashflow / Investition</small></div></div>
        <div className="card chart-card"><div className="card-header"><div><span className="section-kicker">PROGNOSE</span><h3>Kumulativer Rückfluss</h3></div><BarChart3 /></div><MiniChart cashflow={result.cashflow} investment={inputs.investment} /><div className="legend"><span><i className="legend-dot" /> Rückfluss</span><span><i className="legend-line" /> Investition</span></div></div>
        <div className="card breakdown-card"><div className="card-header"><div><span className="section-kicker">ERLÖSAUFTEILUNG</span><h3>Woher kommt der Umsatz?</h3></div><TrendingUp /></div><Breakdown label="Strom" value={result.power} total={result.revenue} color="green" /><Breakdown label="Wärme" value={result.heat} total={result.revenue} color="lime" /><Breakdown label="Biomethan" value={result.gas} total={result.revenue} color="gold" /></div>
        <div className="scenario-card"><div><span className="section-kicker">SZENARIENVERGLEICH</span><h3>Wie robust ist dein Plan?</h3></div><div className="scenario-rows">{Object.entries(scenarioFactors).map(([key, value]) => { const scenCash = result.revenue / factor.revenue * value.revenue - result.costs / factor.costs * value.costs; return <button key={key} className={scenario === key ? 'selected' : ''} onClick={() => setScenario(key as Scenario)}><span className="scenario-name"><i className={`scenario-dot ${key}`} />{value.label}</span><strong>{scenCash > 0 ? `${(inputs.investment / scenCash).toFixed(1).replace('.', ',')} J.` : '—'}</strong><ArrowRight /></button> })}</div></div>
      </aside>
    </div>
    <footer><span>BiogasPlan <small>Überschlägige Planungshilfe</small></span><span>Alle Angaben ohne Gewähr · Stand 2026</span></footer>
  </main>
}

function Breakdown({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percent = total > 0 ? (value / total) * 100 : 0; return <div className="breakdown"><div><span>{label}</span><strong>{money(value)}</strong></div><div className="breakdown-track"><i className={color} style={{ width: `${Math.min(100, percent)}%` }} /></div><small>{number(percent, 0)} % des Umsatzes</small></div> }
