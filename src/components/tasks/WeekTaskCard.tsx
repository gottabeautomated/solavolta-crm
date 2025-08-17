import React from 'react'
import { TaskCard, type TaskCardProps } from './TaskCard'

export function WeekTaskCard(props: TaskCardProps) {
  return <TaskCard {...props} accent="green" compact />
}


