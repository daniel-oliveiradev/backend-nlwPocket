import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import dayjs from 'dayjs'

interface createGoalComplitionRequest {
  goalId: string
}

export async function createGoalCompletion({
  goalId,
}: createGoalComplitionRequest) {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createAt, firstDayOfWeek),
          lte(goalCompletions.createAt, lastDayOfWeek),
          eq(goalCompletions.goalId, goalId)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const result = await db
    .with(goalCompletionCounts)
    .select({
      desireWeeklyFrequency: goals.desiredWeeklyFrequency,
      completionCount: sql /*sql*/`
      COALESCE(${goalCompletionCounts.completionCount}, 0)
    `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)

  const { completionCount, desireWeeklyFrequency } = result[0]

  if (completionCount >= desireWeeklyFrequency) {
    throw new Error('Goal already completed this week!')
  }

  const insertResult = await db
    .insert(goalCompletions)
    .values({ goalId })
    .returning()
  const goalCompletion = insertResult[0]

  return { goalCompletion }
}
