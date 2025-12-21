export interface BarType {
  id: string
  name: string
  weight: number
  unit: 'kg' | 'lb'
}

const BAR_TYPES: Record<string, BarType> = {
  'olympic-20kg': {
    id: 'olympic-20kg',
    name: 'Olympic bar',
    weight: 20,
    unit: 'kg',
  },
  'training-15kg': {
    id: 'training-15kg',
    name: 'Training bar',
    weight: 15,
    unit: 'kg',
  },
  'technique-7.5kg': {
    id: 'technique-7.5kg',
    name: 'Technique bar',
    weight: 7.5,
    unit: 'kg',
  },
}

export function getBarWeight(barTypeId: string): number {
  return BAR_TYPES[barTypeId]?.weight ?? 20
}

export function getBarType(
  barTypeId: string
): BarType | null {
  return BAR_TYPES[barTypeId] ?? null
}

export function listBarTypes(): BarType[] {
  return Object.values(BAR_TYPES)
}
