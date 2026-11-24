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