import { useEffect, useRef, useState } from 'react'
import type { DayPoint } from '../analytics/gaps'
import { formatDayMonth } from '../data/format'

export interface ChartSeries {
  key: 'answered' | 'notFound' | 'negative'
  label: string
  color: string
}

interface DailyChartProps {
  points: DayPoint[]
  series: ChartSeries[]
  totalLabel: string
}

const HEIGHT = 220
const MARGIN = { top: 12, right: 8, bottom: 26, left: 32 }
const SEGMENT_GAP = 2
const CORNER = 4

// Picks a round tick step so the axis has at most five intervals.
function niceScale(value: number): { max: number; step: number } {
  const step = [1, 2, 5, 10, 20, 50].find((candidate) => Math.ceil(value / candidate) <= 5) ?? 100
  return { max: step * Math.max(1, Math.ceil(value / step)), step }
}

// Bar with only the data end (top) rounded, anchored flat on the baseline.
function topRoundedBar(x: number, y: number, width: number, height: number): string {
  const r = Math.min(CORNER, width / 2, height)
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`
}

// Stacked daily bars for the gaps dashboard (Ф-06). Series order and colors are fixed by the caller.
function DailyChart({ points, series, totalLabel }: DailyChartProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const totals = points.map((point) => series.reduce((sum, item) => sum + point[item.key], 0))
  const { max: maxValue, step } = niceScale(Math.max(1, ...totals))
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const band = plotWidth / points.length
  const barWidth = Math.max(4, Math.min(22, band * 0.62))
  const y = (value: number): number => MARGIN.top + plotHeight - (value / maxValue) * plotHeight
  const ticks = Array.from({ length: maxValue / step + 1 }, (_, index) => index * step)
  const labelEvery = Math.ceil(points.length / Math.max(1, Math.floor(plotWidth / 56)))

  const hoveredPoint = hovered !== null ? points[hovered] : null
  // The tooltip sits beside the hovered column, flipping to the left near the right edge.
  const TOOLTIP_WIDTH = 190
  const columnCenter = hovered !== null ? MARGIN.left + band * (hovered + 0.5) : 0
  const tooltipLeft =
    columnCenter + band / 2 + 8 + TOOLTIP_WIDTH > width
      ? columnCenter - band / 2 - 8 - TOOLTIP_WIDTH
      : columnCenter + band / 2 + 8

  return (
    <div className="daily-chart" ref={containerRef} onMouseLeave={() => setHovered(null)}>
      <svg width={width} height={HEIGHT} role="img" aria-hidden="true">
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              className={tick === 0 ? 'daily-chart__baseline' : 'daily-chart__grid'}
            />
            <text
              x={MARGIN.left - 8}
              y={y(tick)}
              className="daily-chart__tick"
              textAnchor="end"
              dy="0.32em"
            >
              {tick}
            </text>
          </g>
        ))}

        {points.map((point, index) => {
          const x = MARGIN.left + band * index + (band - barWidth) / 2
          const nonEmpty = series.filter((item) => point[item.key] > 0)
          let stacked = 0
          return (
            <g key={index}>
              {hovered === index && (
                <rect
                  x={MARGIN.left + band * index}
                  y={MARGIN.top}
                  width={band}
                  height={plotHeight}
                  className="daily-chart__hover"
                />
              )}
              {nonEmpty.map((item, segmentIndex) => {
                const value = point[item.key]
                const top = y(stacked + value)
                const bottom = y(stacked)
                stacked += value
                const isTop = segmentIndex === nonEmpty.length - 1
                const height = Math.max(1, bottom - top - (segmentIndex > 0 ? SEGMENT_GAP : 0))
                return isTop ? (
                  <path
                    key={item.key}
                    d={topRoundedBar(x, top, barWidth, height)}
                    fill={item.color}
                  />
                ) : (
                  <rect
                    key={item.key}
                    x={x}
                    y={top}
                    width={barWidth}
                    height={height}
                    fill={item.color}
                  />
                )
              })}
              {index % labelEvery === (points.length - 1) % labelEvery && (
                <text
                  x={MARGIN.left + band * (index + 0.5)}
                  y={HEIGHT - 6}
                  className="daily-chart__tick"
                  textAnchor="middle"
                >
                  {formatDayMonth(point.date)}
                </text>
              )}
              <rect
                x={MARGIN.left + band * index}
                y={MARGIN.top}
                width={band}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
              />
            </g>
          )
        })}
      </svg>

      {hoveredPoint && (
        <div className="daily-chart__tooltip" style={{ left: tooltipLeft }}>
          <div className="daily-chart__tooltip-date">{formatDayMonth(hoveredPoint.date)}</div>
          {series.map((item) => (
            <div key={item.key} className="daily-chart__tooltip-row">
              <span className="daily-chart__swatch" style={{ background: item.color }} />
              <span>{item.label}</span>
              <span className="daily-chart__tooltip-value">{hoveredPoint[item.key]}</span>
            </div>
          ))}
          <div className="daily-chart__tooltip-row daily-chart__tooltip-total">
            <span />
            <span>{totalLabel}</span>
            <span className="daily-chart__tooltip-value">{totals[hovered!]}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyChart
