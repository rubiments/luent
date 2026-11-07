import { Effect } from "effect"

function divide(a: number, b: number): Effect.Effect<number, Error> {
  return b === 0
    ? Effect.fail(new Error("Cannot divide by zero"))
    : Effect.succeed(a / b)
}