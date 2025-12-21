import type { ExerciseDefinition } from '../domain/models/ExerciseDefinitions'

export interface ExerciseDefinitionRepository {
  getById(id: string): Promise<ExerciseDefinition | null>
  listAll(): Promise<ExerciseDefinition[]>
  save(definition: ExerciseDefinition): Promise<void>
  deleteById(id: string): Promise<void>
}
