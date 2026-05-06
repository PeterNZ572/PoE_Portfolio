import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChaos, formatDivine } from "../lib/format";
import type { CompareMetric, ItemWithTrends } from "../types";

interface CompareChartProps {
  items: ItemWithTrends[];
  metric: CompareMetric;
  onMetricChange: (metric: CompareMetric) => void;
}

const SERIES_COLORS = ["#7dd3fc", "#f59e0b", "#34d399", "#f472b6", "#a78bfa", "#fb7185"];
const tooltipDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatMetricValue(metric: CompareMetric, value: number): string {
  if (metric === "chaosValue") {
    return formatChaos(value);
  }

  return formatDivine(value);
}

function formatTooltipDate(value: string): string {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return tooltipDateFormatter.format(new Date(timestamp));
}

function buildCompareData(items: ItemWithTrends[], metric: CompareMetric): Array<Record<string, number | string | null>> {
  const rows = new Map<string, Record<string, number | string | null>>();

  for (const item of items) {
    const points = item.trend;

    for (const point of points) {
      const currentRow = rows.get(point.date) ?? { date: point.date };
      currentRow[item.id] = metric === "chaosValue" ? point.chaosValue : point.divineValue ?? null;
      rows.set(point.date, currentRow);
    }
  }

  return [...rows.values()]
    .sort((left, right) => String(left.date).localeCompare(String(right.date)));
}

export function CompareChart({ items, metric, onMetricChange }: CompareChartProps) {
  if (items.length === 0) {
    return (
      <section className="panel compare-chart-panel empty-panel">
        <h2>Compare Items</h2>
        <p>Select two or more items from the compare list to overlay them on one trend chart.</p>
      </section>
    );
  }

  const chartData = buildCompareData(items, metric);
  const showDots = chartData.length <= 24;

  return (
    <section className="panel compare-chart-panel">
      <div className="panel-header compare-header">
        <div className="chart-summary">
          <h2>Compare Items</h2>
          <div className="chart-meta-row">
            <span className="chart-meta-pill">
              <strong>Series</strong>
              {items.length}
            </span>
            <span className="chart-meta-pill">
              <strong>Window</strong>
              {chartData.length} points
            </span>
          </div>
        </div>

        <div className="metric-toggle">
          <button
            type="button"
            className={metric === "chaosValue" ? "metric-button is-active" : "metric-button"}
            onClick={() => onMetricChange("chaosValue")}
          >
            Chaos price
          </button>
          <button
            type="button"
            className={metric === "divineValue" ? "metric-button is-active" : "metric-button"}
            onClick={() => onMetricChange("divineValue")}
          >
            Divine price
          </button>
        </div>
      </div>

      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" stroke="#8ea4cc" tick={false} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#8ea4cc"
              tickLine={false}
              axisLine={false}
              width={84}
              tickFormatter={(value: number) =>
                metric === "chaosValue" ? formatChaos(value, true) : formatDivine(value, true)
              }
            />
            <Tooltip
              labelFormatter={(label) => formatTooltipDate(String(label))}
              formatter={(value, name) => {
                if (typeof value !== "number") {
                  return ["Unavailable", name];
                }

                return [formatMetricValue(metric, value), name];
              }}
              contentStyle={{
                backgroundColor: "#121a2d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
              }}
            />
            <Legend />
            {items.map((item, index) => (
              <Line
                key={item.id}
                type="monotone"
                dataKey={item.id}
                name={item.name}
                stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                strokeWidth={3}
                dot={showDots ? { r: 3, strokeWidth: 0 } : false}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
