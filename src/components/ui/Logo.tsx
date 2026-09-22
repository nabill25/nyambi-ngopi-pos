import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  /** Show the "コーヒー" katakana subtitle beneath the bars. */
  showSubtitle?: boolean;
}

/**
 * Nyambi Ngopi brand mark — dark green badge with double bars framing
 * "NYAMBI" and a "コーヒー" (kōhī) subtitle, recreated from the source logo.
 */
export function Logo({ className, showSubtitle = true }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('w-10 h-10', className)}
      role="img"
      aria-label="Nyambi Ngopi"
    >
      <rect width="100" height="100" rx="18" fill="#0d3d20" />
      <rect x="14" y="38" width="72" height="4" fill="#fff" />
      <rect x="14" y="58" width="72" height="4" fill="#fff" />
      <text
        x="50"
        y="53.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="15"
        letterSpacing="1"
        fill="#fff"
      >
        NYAMBI
      </text>
      {showSubtitle && (
        <text
          x="50"
          y="71.5"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="500"
          fontSize="9"
          letterSpacing="1"
          fill="#fff"
        >
          コーヒー
        </text>
      )}
    </svg>
  );
}
