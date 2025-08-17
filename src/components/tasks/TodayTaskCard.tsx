import React from 'react'
import { TaskCard, type TaskCardProps } from './TaskCard'

export function TodayTaskCard(props: TaskCardProps) {
  return <TaskCard {...props} accent="amber" showTime />
}


