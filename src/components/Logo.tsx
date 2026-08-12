/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

/** Served from /public. Change the extension here if the logo file is an .svg / .webp. */
const LOGO_SRC = "/logo.png";

interface LogoProps {
  /** Sizing / shape classes for the logo image, e.g. "h-10 w-10 rounded-xl". */
  className?: string;
  /** Rendered instead of the image when the logo file is missing or fails to load. */
  children?: React.ReactNode;
}

export default function Logo({ className = "", children }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{children}</>;

  return (
    <img
      src={LOGO_SRC}
      alt="IHMA logo"
      onError={() => setFailed(true)}
      className={`object-contain shrink-0 ${className}`}
    />
  );
}
