// Logo mark: a document with a folded accent corner and an AI spark.
function BrandMark({ size = 32 }: { size?: number }): React.JSX.Element {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
    >
      <path d="M0 0H22L32 10V32H0Z" fill="#000" />
      <path d="M22 0V10H32Z" fill="#55DCF6" />
      <path d="M14 10Q15 17 22 18Q15 19 14 26Q13 19 6 18Q13 17 14 10Z" fill="#fff" />
    </svg>
  )
}

export default BrandMark
