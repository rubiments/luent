import { ion } from "luent"

type User = { name: string, location: { street: string } }


declare global {
  function resetGlobal(/*mu*/user: User, count: number): void;
  function readNameGlobal(user: User, count: number): string;
  function storeGlobal(/*um*/user: User): void;
}

export function resetExport(/*mu*/user: User, count: number) {
  user.name = ""
}

export function readNameExport(user: User, count: number) {
  return user.name
}

let _user: User

export function storeExport(/*um*/user: User) {
  _user = user
}


export function createFunctions() {
  function reset(/*mu*/user: User, count: number) {
    user.name = ""
  }

  function readName(user: User, count: number) {
    return user.name
  }

  let _user: User

  function store(/*um*/user: User) {
    _user = user
  }
  return {
    reset,
    readName,
    store
  }
}

export function createReset() {
  return function reset(/*mu*/user: User, count: number) {
    user.name = ""
  }
}

export function createReadName() {
  return function readName(user: User, count: number) {
    return user.name
  }
}

export function createStore() {
  let _user: User

  return [
    function store(/*um*/user: User) {
      _user = user
    },
    function getUser() {
      return _user
    }
  ] as const
}

export function createResetExplicit(): (/*mu*/user: User, count: number) => void {
  function reset(/*mu*/user: User, count: number) {
    user.name = ""
  }

  return reset;
}

export function createStoreExplicit(): [(/*um*/user: User) => void, () => User] {
  let _user: User

  return [
    function store(/*um*/user: User) {
      _user = user
    },
    function getUser() {
      return _user
    }
  ] as const
}

export class App {
  users: User[] = []

  reset(/*mu*/user: User, count: number) {
    user.name = ""
  }

  readName(user: User, count: number) {
    return user.name
  }

  store(/*mu:this*//*um*/user: User) {
    this.users.push(user)
  }

  count = 0

  increment(/*mu:this*/) {
    this.count++
  }

  isNegative() {
    return this.count < 0
  }
}

export class AppExplicit {
  users: User[] = []

  reset(/*mu*/user: User, count: number) {
    user.name = ""
  }

  readName(user: User, count: number) {
    return user.name
  }

  store(/*mu*/this: { users: User[] }, /*um*/user: User) {
    this.users.push(user)
  }

  count = 0

  increment(/*mu*/this: { count: number }) {
    this.count++
  }

  isNegative() {
    return this.count < 0
  }
}

export class ResettableA {
  reset(/*mu*/user: User, count: number) { }
}

export class ResettableB {
  reset(user: User, count: number) { }
}

export class ResettableC {
  reset(/*um*/user: User, count: number) { }
}

export class StorageA {
  store(/*mu:that*//*um*/user: User) { }
}

export class StorageB {
  store(user: User) { }
}

export class StorageC {
  store(/*mu*/user: User) { }
}

export class NameReaderA {
  readName(user: User, count: number) {
    return user.name
  }
}

export class NameReaderB {
  readName(user: User, count: number) {
    return user.name
  }
}

export class NameReaderC {
  readName(/*um*/user: User, count: number) {
    return user.name
  }
}

export class NameReaderD {
  readName(/*mu*/user: User, count: number) {
    return user.name
  }
}

export class ReaderA {
  read() {
    return true
  }
}

export class ReaderB {
  read() {
    return true
  }
}

export class ReaderC {
  read(/*mu:this*/) {
    return true
  }
}

export class ReaderD {
  read(/*mu:that*/) {
    return true
  }
}

export class ReaderE {
  read(/*mu:this/that*/) {
    return true
  }
}

export class CountA {
  increment(/*mu:this*/amount: number) { }
}

export class CountB {
  increment(/*mu:this*/amount: number) { }
}

export class CountC {
  increment(amount: number) { }
}

export class CountD {
  increment(/*mu:that*/amount: number) { }
}

export class CountE {
  increment(/*mu:this/that*/amount: number) { }
}

export class CounterA {
  increment(/*mu:that*/) { }
}

export class CounterB {
  increment() { }
}

export class CounterC {
  increment(/*mu:this*/) { }
}

export class CounterD {
  increment(/*mu:this/that*/) { }
}

export class AppA {
  increment(/*mu:this/that*/) { }
}

export class AppB {
  increment() { }
}

export class AppC {
  increment(/*mu:this*/) { }
}

export class AppD {
  increment(/*mu:that*/) { }
}

export const singleton = {
  users: [] as User[],
  reset(/*mu*/user: User, count: number) {
    user.name = ""
  },

  readName(user: User, count: number) {
    return user.name
  },

  store(/*mu:this*//*um*/user: User) {
    this.users.push(user)
  },

  count: 0,

  increment(/*mu:this*/) {
    this.count++
  },

  isNegative() {
    return this.count < 0
  }
}

export const $app = ion([] as User[], {
  reset(/*mu*/user: User, count: number) {
    user.name = ""
  },

  readName(user: User, count: number) {
    return user.name
  },

  store(/*mu:this*//*um*/user: User) {
    this.value.push(user)
  }
})