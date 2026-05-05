import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompareMetric, ItemWithTrends } from "../types";

interface TrendChartProps {
  item: ItemWithTrends | null;
}

const tooltipDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatChaos(value: number): string {
  return `${value.toFixed(value >= 10 ? 1 : 2)}c`;
}

function formatDivine(value: number): string {
  return `${value.toFixed(value >= 1 ? 2 : 3)} div`;
}

function formatChange(value: number | null): string {
  if (value === null) {
    return "Not enough data";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatTooltipDate(value: string): string {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return tooltipDateFormatter.format(new Date(timestamp));
}

export default function TrendChart({ item }: TrendChartProps) {
  const [metric, setMetric] = useState<CompareMetric>("chaosValue");

  if (!item) {
    return (
      <section className="panel chart-panel empty-panel">
        <h2>Trend View</h2>
        <p>Select an item from the table to render its historical price movement.</p>
      </section>
    );
  }

  const chartData = item.trend.slice(-8);
  const previousPoint = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const latestLabel =
    metric === "chaosValue"
      ? formatChaos(item.chaosValue)
      : item.divineValue !== undefined
        ? formatDivine(item.divineValue)
        : "Unavailable";
  const previousLabel =
    metric === "chaosValue"
      ? previousPoint
        ? formatChaos(previousPoint.chaosValue)
        : "Unavailable"
      : previousPoint?.divineValue !== undefined
        ? formatDivine(previousPoint.divineValue)
        : "Unavailable";
  const yAxisFormatter = (value: number) =>
    metric === "chaosValue" ? formatChaos(value) : formatDivine(value);

  return (
    <section className="panel chart-panel">
      <div className="single-chart-head">
        <div className="single-chart-title">
          <p className="eyebrow">Single Item Trend</p>
          <h2>{item.name}</h2>
        </div>

        <label className="field single-chart-metric">
          <span>Chart metric</span>
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value as CompareMetric)}
          >
            <option value="chaosValue">Chaos price</option>
            <option value="divineValue">Divine price</option>
          </select>
        </label>
      </div>

      <div className="single-chart-stats">
        <div className="single-chart-stat">
          <span>Latest</span>
          <strong>{latestLabel}</strong>
        </div>
        <div className="single-chart-stat">
          <span>Previous</span>
          <strong>{previousLabel}</strong>
        </div>
        <div className="single-chart-stat">
          <span>Window</span>
          <strong>{chartData.length} points</strong>
        </div>
        <div className="single-chart-stat">
          <span>7D</span>
          <strong>{formatChange(item.change7d)}</strong>
        </div>
        <div className="single-chart-stat">
          <span>30D</span>
          <strong>{formatChange(item.change30d)}</strong>
        </div>
      </div>

      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" stroke="#8ea4cc" tick={false} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#8ea4cc"
              tickLine={false}
              axisLine={false}
              tickFormatter={yAxisFormatter}
              width={64}
            />
            <Tooltip
              labelFormatter={(label) => formatTooltipDate(String(label))}
              formatter={(value: number) => [
                metric === "chaosValue" ? formatChaos(value) : formatDivine(value),
                metric === "chaosValue" ? "Chaos price" : "Divine price",
              ]}
              contentStyle={{
                backgroundColor: "#121a2d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="#7dd3fc"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 0, fill: "#f8fafc" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
