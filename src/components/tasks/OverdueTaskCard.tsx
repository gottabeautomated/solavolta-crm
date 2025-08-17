import React from 'react'
import { TaskCard, type TaskCardProps } from './TaskCard'

export function OverdueTaskCard(props: TaskCardProps) {
  return <TaskCard {...props} accent="red" />
}


