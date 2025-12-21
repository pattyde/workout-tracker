export interface BarType {
  id: string
  weight: number
}

const BAR_TYPES: Record<string, BarType> = {
  'olympic-20kg': { id: 'olympic-20kg', weight: 20 },
}

export function getBarWeight(barTypeId: string): number {
  return BAR_TYPES[barTypeId]?.weight ?? 20
}
