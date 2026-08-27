export function missingReplenishmentIndustries(
  industries: Array<{ id: string; name: string }>,
  industryId: string,
  confirmedIndustryIds: string[]
) {
  return industries
    .filter((industry) => industry.id === industryId)
    .filter((industry) => !confirmedIndustryIds.includes(industry.id))
    .map((industry) => industry.name);
}
