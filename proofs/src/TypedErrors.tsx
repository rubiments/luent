

function _divide(a: number, b: number) {
  return a / b
}

type VVV<T> = { [K in keyof T]?: T[K] }


type VVVError = { Error: ErrorConstructor }

class DivisionError extends Error{}


function divide(a: number, b: number,
  x_Error = DivisionError
) {
  if (b === 0) 
    throw new x_Error('Cannot divide by 0')
  return a / b
}

// const divide = Action((a: number, b: number) => {
//   if (b === 0) throw new Error('Cannot divide by 0')
//   return a / b
// }, Error)

// function Action<F extends (...args: any[]) => any, E>(cb: F, error: E): ReturnType<F> & { '~ERROR': E } {
//   return cb()
// }

