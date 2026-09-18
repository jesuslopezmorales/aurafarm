type AuraFarmLogoProps = {
  className?: string;
};

export function AuraFarmLogo({ className }: AuraFarmLogoProps) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <polygon points="374.59 119.42 256 51.2 78 153.6 78 358.4 113.98 379.1 374.59 119.42" fill="#fe874d" />
      <polygon points="140.04 394.09 256 460.8 434 358.4 434 153.6 400.65 134.42 140.04 394.09" fill="#ff6951" />
      <polygon points="256 460.8 434 358.4 434 153.6 256 460.8" fill="#ff3c76" />
      <polygon points="256 51.2 78 153.6 78 358.4 256 51.2" fill="#ffa931" />
    </svg>
  );
}