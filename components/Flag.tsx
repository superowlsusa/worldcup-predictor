import { flagUrl } from '@/lib/flags';

// Shows a country flag for a team. Knockout placeholders (no flag) get a
// neutral dashed badge so the card layout stays balanced.
export default function Flag({ team, height = 34 }: { team: string; height?: number }) {
  const url = flagUrl(team, 'w80');
  const width = Math.round((height * 4) / 3);

  if (!url) {
    return <span className="flag flag-tbd" style={{ width, height }} aria-hidden="true" />;
  }

  return (
    <img
      className="flag"
      src={url}
      srcSet={`${flagUrl(team, 'w80')} 1x, ${flagUrl(team, 'w160')} 2x`}
      alt={`${team} flag`}
      width={width}
      height={height}
      loading="lazy"
    />
  );
}
