//@mu-nocheck

type User = { name: string, location: { street: string } }

export function resetNocheck(/*mu*/user: User, count: number) {
  user.name = ""
}

export function readNameNocheck(user: User, count: number) {
  return user.name
}

let _user: User

export function storeNocheck(/*um*/user: User) {
  _user = user
}

