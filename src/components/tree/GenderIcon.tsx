import { CircleHelp, Mars, NonBinary, UserRound, Venus, VenusAndMars } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GenderOption } from "@/lib/genealogy";

const ICONS = {
  male: Mars,
  female: Venus,
  neutral: NonBinary,
  both: VenusAndMars,
  unspecified: CircleHelp,
  user: UserRound,
} as const;

export type GenderIconName = keyof typeof ICONS;

export const GENDER_ICON_CHOICES: Array<{ value: GenderIconName; label: string }> = [
  { value: "male", label: "Male symbol" },
  { value: "female", label: "Female symbol" },
  { value: "neutral", label: "Non-binary symbol" },
  { value: "both", label: "Combined symbol" },
  { value: "unspecified", label: "Unspecified" },
  { value: "user", label: "Neutral person" },
];

export function GenderIcon({
  gender,
  genders,
  className,
}: {
  gender: string;
  genders: GenderOption[];
  className?: string;
}) {
  const option = genders.find((g) => g.value === gender);
  const Icon = ICONS[(option?.icon ?? "unspecified") as GenderIconName] ?? CircleHelp;
  return <Icon aria-hidden className={cn("size-4", className)} />;
}

export function genderLabel(gender: string, genders: GenderOption[]): string {
  return genders.find((g) => g.value === gender)?.label ?? "Unknown";
}
