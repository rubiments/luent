import { singleton, App, readNameExport, resetExport, storeExport, createFunctions, createReset, createReadName, createStore, createResetExplicit, createStoreExplicit, $app } from "./TestMutabilityAnnotationExport"
import { readNameNocheck, resetNocheck, storeNocheck } from "./TestMutabilityAnnotationNocheck"
import { readNameDts, resetDts, storeDts } from "./TestMutabilityAnnotationDts"
import { readNameDtsAny, resetDtsAny, storeDtsAny } from "./TestMutabilityAnnotationDtsAny"
import { ion } from "luent"

export default {}

type User = { name: string, location: { street: string } }

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


// Invocation boundary rules
// - No incompatible mutability annotations at invocation boundary
// - No missing mutability annotations at invocation boundary
// - No invalid mutability annotations at invocation boundary

// Case: Compile-time invocation annotation: parameter
function case_invocAnnot() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  // nocheck
  resetNocheck(/*mu*/user, 1) // ✅
  resetNocheck(/*um*/user, 1) // ✅
  resetNocheck(user, 1) // ✅

  readNameNocheck(user, 1)  // ✅
  readNameNocheck(/*um*/user, 1) // ✅
  readNameNocheck(/*mu*/user, 1) // ✅

  storeNocheck(/*um*/user) // ✅
  storeNocheck(/*mu*/user) // ✅
  storeNocheck(user) // ✅

  // unchecked .d.ts

  resetDtsAny(/*mu*/user, 1) // ✅
  resetDtsAny(/*um*/user, 1) // ✅
  resetDtsAny(user, 1) // ✅

  readNameDtsAny(user, 1)  // ✅
  readNameDtsAny(/*um*/user, 1) // ✅
  readNameDtsAny(/*mu*/user, 1) // ✅

  storeDtsAny(/*um*/user) // ✅
  storeDtsAny(/*mu*/user) // ✅
  storeDtsAny(user) // ✅


  // global
  resetGlobal(/*mu*/user, 1) // ✅
  resetGlobal(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetGlobal(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readNameGlobal(user, 1)  // ✅
  readNameGlobal(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readNameGlobal(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  storeGlobal(/*um*/user) // ✅
  storeGlobal(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  storeGlobal(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  // imported
  resetExport(/*mu*/user, 1) // ✅
  resetExport(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetExport(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readNameExport(user, 1)  // ✅
  readNameExport(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readNameExport(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  storeExport(/*um*/user) // ✅
  storeExport(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  storeExport(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  // .d.ts
  resetDts(/*mu*/user, 1) // ✅
  resetDts(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetDts(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readNameDts(user, 1)  // ✅
  readNameDts(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readNameDts(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  storeDts(/*um*/user) // ✅
  storeDts(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  storeDts(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  // local
  reset(/*mu*/user, 1) // ✅
  reset(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName(user, 1)  // ✅
  readName(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store(/*um*/user) // ✅
  store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  // private
  resetPrivate(/*mu*/user, 1) // ✅
  resetPrivate(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetPrivate(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readNamePrivate(user, 1)  // ✅
  readNamePrivate(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readNamePrivate(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  storePrivate(/*um*/user) // ✅
  storePrivate(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  storePrivate(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  function resetPrivate(/*mu*/user: User, count: number) {
    user.name = ""
  }

  function readNamePrivate(user: User, count: number) {
    return user.name
  }

  let _user: User

  function storePrivate(/*um*/user: User) {
    _user = user
  }
}

function case_invocAnnot_noInvalid() {

  const user = { name: 'kermit', location: { street: 'swamp' } }
  const userB = { name: 'sir robin', location: { street: 'well' } }
  const count = 1;
  const name = 'robin';
  const active = true;
  const nah = null;
  const uh = undefined;
  const sym = Symbol()

  // invalid type: variable
  foo(
    /*mu*/count, // ⚠️ warning(count): Expected no mutability annotation for this argument.
    /*mu*/name, // ⚠️ warning(name): Expected no mutability annotation for this argument.
    /*mu*/active, // ⚠️ warning(active): Expected no mutability annotation for this argument.
    /*um*/user, // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
    /*mu*/nah, // ⚠️ warning(nah): Expected no mutability annotation for this argument.
    /*mu*/uh, // ⚠️ warning(uh): Expected no mutability annotation for this argument.
    /*mu*/sym, // ⚠️ warning(sym): Expected no mutability annotation for this argument.
    /*mu*/userB // ⚠️ warning(userB): Expected mutability annotation /*um*/ for this argument.
  )

  // invalid type: literal
  foo(
    /*mu*/12, // ⚠️ warning(12): Expected no mutability annotation for this argument.
    /*mu*/'robin', // ⚠️ warning('robin'): Expected no mutability annotation for this argument.
    /*mu*/false, // ⚠️ warning(false): Expected no mutability annotation for this argument.
    /*mu*/{ name: 'kermit', location: { street: 'swamp' } }, // ✅
    /*mu*/null, // ⚠️ warning(null): Expected no mutability annotation for this argument.
    /*mu*/undefined, // ⚠️ warning(undefined): Expected no mutability annotation for this argument.
    /*mu*/Symbol(), // ⚠️ warning(Symbol()): Expected no mutability annotation for this argument.
    /*um*/{ name: 'sir robin', location: { street: 'well' } } // ✅
  )

  // valid: union
  fooUnion(
    /*mu*/{ name: 'kermit', location: { street: 'swamp' } }, // ✅
    /*mu*/user, // ✅
    /*mu*/{ name: 'sir robin', location: { street: 'well' } }, // ✅
    /*mu*/{ name: 'sir robin', location: { street: 'well' } }, // ✅
    /*mu*/{ name: 'sir robin', location: { street: 'well' } }, // ✅
    /*mu*/{ name: 'sir robin', location: { street: 'well' } }, // ✅
    /*mu*/{ name: 'sir robin', location: { street: 'well' } }, // ✅
    /*um*/userB // ✅
  )

  // invalid type: union
  fooUnion(
    /*mu*/count, // ⚠️ warning(count): Expected no mutability annotation for this argument.
    /*mu*/name, // ⚠️ warning(name): Expected no mutability annotation for this argument.
    /*mu*/active, // ⚠️ warning(active): Expected no mutability annotation for this argument.
    /*um*/'kermit', // ⚠️ warning('kermit'): Expected no mutability annotation for this argument.
    /*mu*/nah, // ⚠️ warning(nah): Expected no mutability annotation for this argument.
    /*mu*/uh, // ⚠️ warning(uh): Expected no mutability annotation for this argument.
    /*mu*/sym, // ⚠️ warning(sym): Expected no mutability annotation for this argument.
    /*mu*/userB // ⚠️ warning(userB): Expected mutability annotation /*um*/ for this argument.
  )

  // invalid type: generic
  fooGeneric(/*mu*/count) // ⚠️ warning(count): Expected no mutability annotation for this argument.
  fooGeneric(/*mu*/name) // ⚠️ warning(name): Expected no mutability annotation for this argument.
  fooGeneric(/*mu*/active) // ⚠️ warning(active): Expected no mutability annotation for this argument.
  fooGeneric(/*mu*/nah) // ⚠️ warning(nah): Expected no mutability annotation for this argument.
  fooGeneric(/*mu*/uh) // ⚠️ warning(uh): Expected no mutability annotation for this argument.
  fooGeneric(/*mu*/sym) // ⚠️ warning(sym): Expected no mutability annotation for this argument.
  fooGeneric(/*mu*/user) // ✅


  let users: User[] = []

  function foo(
    count: number,
    name: string,
    active: boolean,
    /*mu*/user: User,
    nah: null,
    uh: undefined,
    sym: symbol,
    /*um*/userB: User,
  ) {
    user.name = ""
    users.push(userB)
    users.push(user)
  }

  function fooUnion(
    /*mu*/count: number | User,
    /*mu*/name: string | User,
    /*mu*/active: boolean | User,
    /*mu*/user: any,
    /*mu*/nah: null | User,
    /*mu*/uh: undefined | User,
    /*mu*/sym: symbol | User,
    /*um*/userB: User,
  ) {
    user.name = ""
    users.push(userB)
    users.push(user)
  }

  function fooGeneric<T>(
    /*mu*/user: T,
  ) {
    if (typeof user === 'object' && user && 'name' in user) {
      user.name = ''
    }
  }
}

// Case: Compile-time invocation annotation: parameter pack
function case_invocAnnot_parameterPack() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset({/*mu*/user: user, count: 2 }, 1) // ✅
  reset({/*um*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset({ user: user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName({ user: user, count: 2 }, 1)  // ✅
  readName({/*um*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName({/*mu*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store({/*um*/user: user, count: 2 }, 1) // ✅
  store({/*mu*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store({ user: user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  reset({/*mu*/user, count: 2 }, 1) // ✅
  reset({/*um*/user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset({ user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName({ user, count: 2 }, 1)  // ✅
  readName({/*um*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName({/*mu*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store({/*um*/user, count: 2 }, 1) // ✅
  store({/*mu*/user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store({ user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  function reset(pack: {/*mu*/user: User, count: number }, count: number) {
    user.name = ""
  }

  function readName(pack: { user: User, count: number }, count: number) {
    return user.name
  }

  let _user: User

  function store(pack: {/*um*/user: User, count: number }, count: number) {
    _user = user
  }
}


// Case: Compile-time invocation annotation: rest parameters
function case_invocAnnot_rest() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const userB = { name: 'sir robin', location: { street: 'well' } }
  const myUsers = [user, userB]
  const someUsers = [user, userB, null]

  reset(0, /*mu*/user, /*mu*/userB) // ✅
  reset(0, /*um*/user, /*mu*/userB) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(0, user, /*mu*/userB) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName(0, user, userB)  // ✅
  readName(0, /*mu*/user, userB) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName(0, /*um*/user, userB) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store(0, /*um*/user, /*um*/userB) // ✅
  store(0, /*mu*/user, /*um*/userB) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(0, user, /*um*/userB) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  reset(0, /*mu*/...myUsers) // ✅
  reset(0, /*um*/...myUsers) // ⚠️ warning(...myUsers): Expected mutability annotation /*mu*/ for this argument.
  reset(0, ...myUsers) // ⚠️ warning(...myUsers): Expected mutability annotation /*mu*/ for this argument.

  readName(0, ...myUsers)  // ✅
  readName(0, /*mu*/...myUsers) // ⚠️ warning(...myUsers): Expected no mutability annotation for this argument.
  readName(0, /*um*/...myUsers) // ⚠️ warning(...myUsers): Expected no mutability annotation for this argument.

  store(0, /*um*/...myUsers) // ✅
  store(0, /*mu*/...myUsers) // ⚠️ warning(...myUsers): Expected mutability annotation /*um*/ for this argument.
  store(0, ...myUsers) // ⚠️ warning(...myUsers): Expected mutability annotation /*um*/ for this argument.

  resetUnion(0, /*mu*/user, null) // ✅
  resetUnion(0, /*mu*/user, /*mu*/null) // ⚠️ warning(null): Expected no mutability annotation for this argument.

  resetUnion(0, /*mu*/...myUsers) // ✅
  resetUnion(0, ...myUsers) // ⚠️ warning(...myUsers): Expected mutability annotation /*mu*/ for this argument.

  function reset(count: number, ...users: /*mu*/User[]) {
    user.name = ""
  }

  function readName(count: number, ...users: User[]) {
    return user.name
  }

  const users: User[] = []

  function store(count: number, ...users: /*um*/User[]) {
    users.push(...users)
  }

  function resetUnion(count: number, ...users: /*mu*/(User | null)[]) {
    user.name = ""
  }
}

// Case: Compile-time invocation annotation: callbacks
function case_invocAnnot_callbacks(
  reset: (/*mu*/user: User, count: number) => void,
  readName: (user: User, count: number) => string,
  store: (/*um*/user: User) => void,
) {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset(/*mu*/user, 1) // ✅
  reset(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName(user, 1)  // ✅
  readName(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store(/*um*/user) // ✅
  store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
}

// Case: Compile-time invocation annotation: from higher order functions
function case_invocAnnot_higherorder() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  const { reset, readName, store } = createFunctions()

  reset(/*mu*/user, 1) // ✅
  reset(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName(user, 1)  // ✅
  readName(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store(/*um*/user) // ✅
  store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  const resetB = createReset()
  const readNameB = createReadName()
  const [storeB] = createStore()

  resetB(/*mu*/user, 1) // ✅
  resetB(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetB(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readNameB(user, 1)  // ✅
  readNameB(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readNameB(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  storeB(/*um*/user) // ✅
  storeB(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  storeB(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  const resetExplicit = createResetExplicit()
  const [storeExplicit] = createStoreExplicit()

  resetExplicit(/*mu*/user, 1) // ✅
  resetExplicit(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetExplicit(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  storeExplicit(/*um*/user) // ✅
  storeExplicit(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  storeExplicit(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
}

// Case: Compile-time invocation annotation: class methods
function case_invocAnnot_classMethods() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  const app = new App()

  app.reset(/*mu*/user, 1) // ✅
  app.reset(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  app.reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  app.readName(user, 1)  // ✅
  app.readName(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  app.readName(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  app.store(/*um*/user) // ✅
  app.store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  app.store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
}


// Case: Compile-time invocation annotation: object literal methods
function case_invocAnnot_literalMethods() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  singleton.reset(/*mu*/user, 1) // ✅
  singleton.reset(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  singleton.reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  singleton.readName(user, 1)  // ✅
  singleton.readName(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  singleton.readName(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  singleton.store(/*um*/user) // ✅
  singleton.store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  singleton.store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
}

// Case: Compile-time invocation annotation: synthetic methods
function case_invocAnnot_synthMethods() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  const $app = ion([] as User[], {
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

  $app.reset(/*mu*/user, 1) // ✅
  $app.reset(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  $app.reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  $app.readName(user, 1)  // ✅
  $app.readName(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  $app.readName(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  $app.store(/*um*/user) // ✅
  $app.store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  $app.store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
}

// Case: Compile-time invocation annotation: imported synthetic methods
function case_invocAnnot_importedSynthMethods() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  $app.reset(/*mu*/user, 1) // ✅
  $app.reset(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  $app.reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  $app.readName(user, 1)  // ✅
  $app.readName(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  $app.readName(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  $app.store(/*um*/user) // ✅
  $app.store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  $app.store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
}

