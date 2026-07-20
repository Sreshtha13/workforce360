type MiniChartProps = {
  data?: number[];
  className?: string;
  color?: "blue" | "emerald" | "amber" | "rose" | "indigo";
};

const colorMap = {
  blue: { stroke: "stroke-blue-500/70", fill: "fill-blue-500/10" },
  emerald: { stroke: "stroke-emerald-500/70", fill: "fill-emerald-500/10" },
  amber: { stroke: "stroke-amber-500/70", fill: "fill-amber-500/10" },
  rose: { stroke: "stroke-rose-500/70", fill: "fill-rose-500/10" },
  indigo: { stroke: "stroke-indigo-500/70", fill: "fill-indigo-500/10" },
};

export function MiniChart({
  data = [4, 7, 5, 9, 6, 11, 8],
  className,
  color = "blue",
}: MiniChartProps) {
  const width = 80;
  const height = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const colors = colorMap[color];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      preserveAspectRatio="none"
    >
      <polygon points={areaPoints} className={colors.fill} />
      <polyline
        points={points}
        fill="none"
        className={colors.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
