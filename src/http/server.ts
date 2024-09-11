import fastify from 'fastify'
import { creatGoal } from '../functions/create-goal'
import z from 'zod'

const app = fastify()

app.post('/goals', async request => {
  const creatGoalSchema = z.object({
    title: z.string(),
    desiredWeeklyFrequency: z.number().int().min(1).max(7),
  })

  const body = creatGoalSchema.parse(request.body)

  await creatGoal({
    title: body.title,
    desiredWeeklyFrequency: body.desiredWeeklyFrequency,
  })
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
