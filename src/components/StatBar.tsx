/**
 * A single toddler-readable stat meter (icon + bar). Presentational —
 * verified via build plus manual/Playwright checks.
 */
interface StatBarProps {
	label: string;
	icon: string;
	value: number;
}

export default function StatBar({ label, icon, value }: StatBarProps) {
	const clamped = Math.min(100, Math.max(0, Math.round(value)));
	return (
		<div className="stat-row">
			<span className="stat-icon" aria-hidden="true">
				{icon}
			</span>
			<meter
				className="stat-track"
				min={0}
				max={100}
				value={clamped}
				aria-label={label}
			/>
		</div>
	);
}
