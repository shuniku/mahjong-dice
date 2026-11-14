export interface FakeScheduler {
  readonly schedule: (task: () => void, delayMs: number) => void
  readonly flush: () => void
  readonly pendingCount: () => number
}

export function createFakeScheduler(): FakeScheduler {
  let tasks: (() => void)[] = []
  return {
    schedule: (task) => {
      tasks = [...tasks, task]
    },
    flush: () => {
      const running = tasks
      tasks = []
      running.forEach((task) => task())
    },
    pendingCount: () => tasks.length,
  }
}
