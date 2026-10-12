import { mountIsland } from 'luent'
import { HabitTracker } from './HabitTracker'

mountIsland(() => (
  <HabitTracker habit='water' goal={8}/>
), '#habit-tracker')

