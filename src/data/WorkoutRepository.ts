import type { Workout } from '../domain/models/Workout'

export interface WorkoutRepository {
  getById(id: string): Promise<Workout | null>
  listAll(): Promise<Workout[]>
  save(workout: Workout): Promise<void>
  deleteById(id: string): Promise<void>
}
