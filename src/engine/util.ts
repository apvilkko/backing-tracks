export const randRange = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))
export const randRangeFloat = (min: number, max: number) =>
  min + Math.random() * (max - min)

export const rand = (value: number) => Math.random() < value / 100.0

export const maybe = (prob: number | Record<any, any>, opt1, opt2) => {
  if (typeof prob === 'number') {
    return rand(prob) ? opt1 : opt2
  }
  let sum = 0
  let chosen = null
  const sorted = Object.keys(prob).sort((a, b) => {
    if (a === 'rest') {
      return 1
    } else if (b === 'rest') {
      return -1
    }
    return ((a as unknown) as number) - ((b as unknown) as number)
  })
  sorted.forEach(key => {
    sum += key === 'rest' ? 100 - sum : Number(key)
    if (!chosen && rand(sum)) {
      chosen = prob[key]
    }
  })
  return chosen
}

export function sample<T>(arr: Array<T>): T | undefined {
  return arr.length > 0 ? arr[randRange(0, arr.length - 1)] : undefined
}
