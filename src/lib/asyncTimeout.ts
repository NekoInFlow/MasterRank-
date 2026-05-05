/** Отклонение при превышении времени ожидания сетевого запроса (мобильные сети, «зависшие» ответы). */
export class TimeoutError extends Error {
  override name = 'TimeoutError'
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new TimeoutError(`Request exceeded ${ms}ms`))
    }, ms)

    promise.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (err: unknown) => {
        clearTimeout(id)
        reject(err instanceof Error ? err : new Error(String(err)))
      },
    )
  })
}
