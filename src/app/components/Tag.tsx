import React from "react";

export default function Tag({ label }: { label: string }) {
  return <span className="uppercase font-semibold text-xs leading-none p-2 border rounded-md border-neutral-800 w-fit">{label}</span>;
}
