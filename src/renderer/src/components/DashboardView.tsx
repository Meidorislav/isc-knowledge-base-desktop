import { useMemo, useState } from 'react'
import {
  CircleCheck,
  CircleHelp,
  FileText,
  MessageSquareText,
  RotateCcw,
  ThumbsDown,
  Upload
} from 'lucide-react'
import type { KbSection } from '../types/knowledgeBase'
import type { Gap, GapReason } from '../types/analytics'
import type { QueryLog } from '../analytics/useQueryLog'
import {
  buildGaps,
  dailySeries,
  inPeriod,
  ownerBreakdown,
  sectionBreakdown,
  type BreakdownRow
} from '../analytics/gaps'
import { localize } from '../data/localize'
import { formatDateTime, formatDayMonth, formatTime } from '../data/format'
import DailyChart, { type ChartSeries } from './DailyChart'
import { useI18n } from '../i18n/context'

interface DashboardViewProps {
  sections: KbSection[]
  queryLog: QueryLog
  onOpenDocument: (documentId: string) => void
  onUpload: (sectionId: string | null) => void
  onToast: (text: string) => void
}

type Period = 7 | 30

// Categorical slots 1–3 of the reference palette, validated for adjacent CVD separation.
const SERIES_COLORS = { answered: '#2a78d6', notFound: '#eb6834', negative: '#1baf7a' }

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

// Gaps dashboard (Ф-06): unanswered and poorly rated questions for section owners.
function DashboardView({
  sections,
  queryLog,
  onOpenDocument,
  onUpload,
  onToast
}: DashboardViewProps): React.JSX.Element {
  const { t, language } = useI18n()
  const [period, setPeriod] = useState<Period>(30)
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart')
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [reasonFilter, setReasonFilter] = useState<GapReason | null>(null)
  const [now] = useState(() => new Date())

  const { records, resolvedAt } = queryLog
  const periodRecords = useMemo(() => inPeriod(records, period, now), [records, period, now])
  const gaps = useMemo(() => buildGaps(periodRecords, resolvedAt), [periodRecords, resolvedAt])
  const points = useMemo(
    () => dailySeries(periodRecords, period, now),
    [periodRecords, period, now]
  )

  const notFound = periodRecords.filter((record) => record.outcome === 'not-found').length
  const rated = periodRecords.filter((record) => record.rating !== null).length
  const negative = periodRecords.filter((record) => record.rating === 'down').length
  const openGaps = gaps.filter((gap) => !gap.resolved)
  const resolvedGaps = gaps.filter((gap) => gap.resolved)
  const visibleGaps = (tab === 'open' ? openGaps : resolvedGaps).filter(
    (gap) => reasonFilter === null || gap.reason === reasonFilter
  )

  const series: ChartSeries[] = [
    { key: 'answered', label: t.dashboard.seriesAnswered, color: SERIES_COLORS.answered },
    { key: 'notFound', label: t.dashboard.seriesNotFound, color: SERIES_COLORS.notFound },
    { key: 'negative', label: t.dashboard.seriesNegative, color: SERIES_COLORS.negative }
  ]

  const sectionTitle = (sectionId: string | null): string => {
    const section = sections.find((item) => item.id === sectionId)
    return section ? localize(section.title, language) : t.dashboard.undeterminedSection
  }
  const documentTitle = (documentId: string | null): string | null => {
    for (const section of sections) {
      const doc = section.documents.find((item) => item.id === documentId)
      if (doc) return localize(doc.title, language)
    }
    return null
  }

  const toggleResolved = (gap: Gap): void => {
    queryLog.setResolved(gap.key, !gap.resolved)
    onToast(gap.resolved ? t.dashboard.toastReopened : t.dashboard.toastResolved)
  }

  const kpis = [
    {
      label: t.dashboard.kpiQuestions,
      value: periodRecords.length,
      note: t.dashboard.kpiPerDay((periodRecords.length / period).toFixed(1))
    },
    {
      label: t.dashboard.kpiNotFound,
      value: notFound,
      note: t.dashboard.kpiShareOfQuestions(percent(notFound, periodRecords.length))
    },
    {
      label: t.dashboard.kpiNegative,
      value: negative,
      note: t.dashboard.kpiShareOfRated(percent(negative, rated))
    },
    {
      label: t.dashboard.kpiOpenGaps,
      value: openGaps.length,
      note: t.dashboard.kpiResolved(resolvedGaps.length)
    }
  ]

  return (
    <div className="page page--wide dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="doc__title">{t.dashboard.title}</h1>
          <p className="dashboard__subtitle">{t.dashboard.subtitle}</p>
        </div>
        <div className="dashboard__controls">
          <span className="dashboard__updated">{t.dashboard.updated(formatTime(now))}</span>
          <div className="toggle-group" role="group">
            {([7, 30] as Period[]).map((value) => (
              <button
                key={value}
                type="button"
                className={'toggle-group__item' + (period === value ? ' is-active' : '')}
                onClick={() => setPeriod(value)}
              >
                {value === 7 ? t.dashboard.period7 : t.dashboard.period30}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi">
            <div className="kpi__label">{kpi.label}</div>
            <div className="kpi__value">{kpi.value}</div>
            <div className="kpi__note">{kpi.note}</div>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel__header">
          <h2 className="panel__title">{t.dashboard.chartTitle}</h2>
          <div className="chart-legend">
            {series.map((item) => (
              <span key={item.key} className="chart-legend__item">
                <span className="daily-chart__swatch" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          <div className="toggle-group toggle-group--small" role="group">
            <button
              type="button"
              className={'toggle-group__item' + (chartView === 'chart' ? ' is-active' : '')}
              onClick={() => setChartView('chart')}
            >
              {t.dashboard.viewChart}
            </button>
            <button
              type="button"
              className={'toggle-group__item' + (chartView === 'table' ? ' is-active' : '')}
              onClick={() => setChartView('table')}
            >
              {t.dashboard.viewTable}
            </button>
          </div>
        </div>
        {chartView === 'chart' ? (
          <DailyChart points={points} series={series} totalLabel={t.dashboard.colTotal} />
        ) : (
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.dashboard.colDate}</th>
                  {series.map((item) => (
                    <th key={item.key} className="num">
                      {item.label}
                    </th>
                  ))}
                  <th className="num">{t.dashboard.colTotal}</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((point) => (
                  <tr key={point.date.toISOString()}>
                    <td>{formatDayMonth(point.date)}</td>
                    <td className="num">{point.answered}</td>
                    <td className="num">{point.notFound}</td>
                    <td className="num">{point.negative}</td>
                    <td className="num">{point.answered + point.notFound + point.negative}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="dashboard__columns">
        <BreakdownTable
          title={t.dashboard.bySection}
          firstColumn={t.dashboard.colSection}
          rows={sectionBreakdown(periodRecords, gaps, sections)}
          labelOf={(row) => sectionTitle(row.id)}
        />
        <BreakdownTable
          title={t.dashboard.byOwner}
          firstColumn={t.dashboard.colOwner}
          rows={ownerBreakdown(periodRecords, gaps, sections)}
          labelOf={(row) => row.label ?? t.dashboard.unassignedOwner}
        />
      </div>

      <section className="panel">
        <div className="panel__header">
          <h2 className="panel__title">{t.dashboard.gapsTitle}</h2>
          <div className="tabs">
            <button
              type="button"
              className={'tabs__tab' + (tab === 'open' ? ' is-active' : '')}
              onClick={() => setTab('open')}
            >
              {t.dashboard.tabOpen}
              <span className="tabs__count">{openGaps.length}</span>
            </button>
            <button
              type="button"
              className={'tabs__tab' + (tab === 'resolved' ? ' is-active' : '')}
              onClick={() => setTab('resolved')}
            >
              {t.dashboard.tabResolved}
              <span className="tabs__count">{resolvedGaps.length}</span>
            </button>
          </div>
          <div className="toggle-group toggle-group--small" role="group">
            {([null, 'not-found', 'negative'] as (GapReason | null)[]).map((reason) => (
              <button
                key={reason ?? 'all'}
                type="button"
                className={'toggle-group__item' + (reasonFilter === reason ? ' is-active' : '')}
                onClick={() => setReasonFilter(reason)}
              >
                {reason === null
                  ? t.dashboard.filterAll
                  : reason === 'not-found'
                    ? t.dashboard.reasonNotFound
                    : t.dashboard.reasonNegative}
              </button>
            ))}
          </div>
        </div>

        {visibleGaps.length === 0 ? (
          <div className="dashboard__empty">
            <CircleCheck size={24} strokeWidth={1.6} />
            <div className="dashboard__empty-title">
              {tab === 'open' ? t.dashboard.emptyOpenTitle : t.dashboard.emptyResolvedTitle}
            </div>
            <p>{tab === 'open' ? t.dashboard.emptyOpenText : t.dashboard.emptyResolvedText}</p>
          </div>
        ) : (
          <ul className="gap-list">
            {visibleGaps.map((gap) => {
              const docTitle = documentTitle(gap.documentId)
              return (
                <li key={gap.key} className={'gap' + (gap.resolved ? ' is-resolved' : '')}>
                  <div className="gap__main">
                    <div className="gap__top">
                      <span className={`reason reason--${gap.reason}`}>
                        {gap.reason === 'not-found' ? (
                          <CircleHelp size={13} />
                        ) : (
                          <ThumbsDown size={13} />
                        )}
                        {gap.reason === 'not-found'
                          ? t.dashboard.reasonNotFound
                          : t.dashboard.reasonNegative}
                      </span>
                      <span className="gap__count">{t.dashboard.timesAsked(gap.count)}</span>
                      <span className="gap__date">
                        {t.dashboard.lastAsked(formatDateTime(gap.lastAskedAt))}
                      </span>
                    </div>
                    <div className="gap__question">{gap.question}</div>
                    <div className="gap__meta">
                      {sectionTitle(gap.sectionId)}
                      {docTitle && ` › ${docTitle}`}
                    </div>
                    {gap.comments.length > 0 && (
                      <div className="gap__comment">
                        <MessageSquareText size={14} />
                        <span>«{gap.comments[0]}»</span>
                      </div>
                    )}
                  </div>
                  <div className="gap__actions">
                    {gap.documentId && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => onOpenDocument(gap.documentId!)}
                      >
                        <FileText size={14} />
                        {t.dashboard.openDocument}
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => onUpload(gap.sectionId)}
                    >
                      <Upload size={14} />
                      {t.dashboard.uploadDocument}
                    </button>
                    <button
                      type="button"
                      className={
                        'button button--small ' +
                        (gap.resolved ? 'button--secondary' : 'button--primary')
                      }
                      onClick={() => toggleResolved(gap)}
                    >
                      {gap.resolved ? <RotateCcw size={14} /> : <CircleCheck size={14} />}
                      {gap.resolved ? t.dashboard.reopen : t.dashboard.markResolved}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

interface BreakdownTableProps {
  title: string
  firstColumn: string
  rows: BreakdownRow[]
  labelOf: (row: BreakdownRow) => string
}

function BreakdownTable({
  title,
  firstColumn,
  rows,
  labelOf
}: BreakdownTableProps): React.JSX.Element {
  const { t } = useI18n()
  const maxOpen = Math.max(1, ...rows.map((row) => row.openGaps))
  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">{title}</h2>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>{firstColumn}</th>
            <th className="num">{t.dashboard.colQuestions}</th>
            <th className="num">{t.dashboard.colNotFound}</th>
            <th className="num">{t.dashboard.colNegative}</th>
            <th className="num">{t.dashboard.colOpenGaps}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? 'none'} className={row.id === null ? 'is-muted' : undefined}>
              <td>{labelOf(row)}</td>
              <td className="num">{row.questions}</td>
              <td className="num">{row.notFound || '—'}</td>
              <td className="num">{row.negative || '—'}</td>
              <td className="num">
                <span className="bar-cell">
                  <span
                    className="bar-cell__bar"
                    style={{ width: `${(row.openGaps / maxOpen) * 100}%` }}
                  />
                  <span className="bar-cell__value">{row.openGaps}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default DashboardView
