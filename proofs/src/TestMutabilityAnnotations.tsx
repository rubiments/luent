import { singleton, App, AppExplicit, readNameExport, resetExport, storeExport, createFunctions, createReset, createReadName, createStore, createResetExplicit, createStoreExplicit, $app } from "./TestMutabilityAnnotationExport"
import * as mutabilityExport from "./TestMutabilityAnnotationExport"
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

  // shorthand
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
    pack.user.name = ""
  }

  function readName(pack: { user: User, count: number }, count: number) {
    return pack.user.name
  }

  let _user: User

  function store(pack: {/*um*/user: User, count: number }, count: number) {
    _user = pack.user
  }
}


// Case: Compile-time invocation annotation: argument pack non-inline arg
function case_invocAnnot_argumentPack_noninline() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const pack = {/*mu*/user: user, count: 2 }

  reset(pack, 1) // ⚠️ warning(pack): Expected mutability annotation /*mu*/ for `user` property in this argument.

  function reset(pack: {/*mu*/user: User, count: number }, count: number) {
    pack.user.name = ""
  }
}


// Case: Compile-time invocation annotation: destructured parameters
function case_invocAnnot_destructuredParameters() {
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

  // shorthand
  reset({/*mu*/user, count: 2 }, 1) // ✅
  reset({/*um*/user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset({ user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName({ user, count: 2 }, 1)  // ✅
  readName({/*um*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName({/*mu*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store({/*um*/user, count: 2 }, 1) // ✅
  store({/*mu*/user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store({ user, count: 2 }, 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  function reset({ user, count: countB }: { /*mu*/user: User, count: number }, count: number) {
    user.name = ""
  }

  function readName({ user, count: countB }: { user: User, count: number }, count: number) {
    return user.name
  }

  let _user: User

  function store({ user, count: countB }: {/*um*/user: User, count: number }, count: number) {
    _user = user
  }
}


// Case: Compile-time invocation annotation: parameter pack, non-inline
function case_invocAnnot_parameterPack_noninline() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset({/*mu*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  reset({/*um*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  reset({ user: user, count: 2 }, 1) // ✅

  readName({ user: user, count: 2 }, 1)  // ✅
  readName({/*um*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName({/*mu*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store({/*um*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  store({/*mu*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  store({ user: user, count: 2 }, 1) // ✅

  // shorthand
  reset({/*mu*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  reset({/*um*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  reset({ user, count: 2 }, 1) // ✅

  readName({ user, count: 2 }, 1)  // ✅
  readName({/*um*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName({/*mu*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store({/*um*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  store({/*mu*/user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  store({ user, count: 2 }, 1) // ✅

  type PackMu = {/*mu*/user: User, count: number }
  type Pack = { user: User, count: number }
  type PackUm = {/*um*/user: User, count: number }

  function reset(pack: PackMu, count: number) {
    pack.user.name = ""
  }

  function readName(pack: Pack, count: number) {
    return pack.user.name
  }

  let _user: User

  function store(pack: PackUm, count: number) {
    _user = pack.user
  }
}


// Case: Compile-time invocation annotation: parameter vs parameter pack
function case_invocAnnot_parameter_v_parameterPack() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset(/*mu*/{ user: user, count: 2 }, 1)// ✅
  reset({/*mu*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  // ⚠️ warning({ user: user, count: 2 }): Expected mutability annotation /*mu*/ for this argument.

  reset({/*um*/user: user, count: 2 }, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  // ⚠️ warning({ user: user, count: 2 }): Expected mutability annotation /*mu*/ for this argument.

  reset({ user: user, count: 2 }, 1) // ⚠️ warning({ user: user, count: 2 }): Expected mutability annotation /*mu*/ for this argument.

  function reset(/*mu*/pack: {/*mu*/user: User, count: number }, count: number) {
    pack.user.name = ""
  }
}



// Case: Compile-time invocation annotation: tuple
function case_invocAnnot_tuples() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset([/*mu*/user, 2], 1) // ✅
  reset([/*um*/user, 2], 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset([user, 2], 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readName([user, 2], 1)  // ✅
  readName([/*mu*/user, 2], 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName([/*um*/user, 2], 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  store([/*um*/user, 2], 1) // ✅
  store([/*mu*/user, 2], 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store([user, 2], 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  function reset(tup: [/*mu*/User, number], count: number) {
    tup[0].name = ""
  }

  function readName(tup: [User, number], count: number) {
    return tup[0].name
  }

  let _user: User

  function store(tup: [/*um*/User, number], count: number) {
    _user = tup[0]
  }
}



// Case: Compile-time invocation annotation: tuple non-inline
function case_invocAnnot_tuples_noninline() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const tuple = [/*mu*/user, 2] as const

  reset(tuple, 1) // ⚠️ warning(tuple): Expected mutability annotation /*mu*/ for index 1 of this argument.

  function reset(tup: readonly [/*mu*/User, number], count: number) {
    tup[0].name = ""
  }
}




// Case: Compile-time invocation annotation: parameter v tuple
function case_invocAnnot_parameter_v_tuple() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset(/*mu*/[user, 2], 1) // ✅
  reset([/*mu*/user, 2], 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  // ⚠️ warning([user, 2]): Expected mutability annotation /*mu*/ for this argument.

  reset([/*um*/user, 2], 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  // ⚠️ warning([user, 2]): Expected mutability annotation /*mu*/ for this argument.

  reset([user, 2], 1) // ⚠️ warning([user, 2]): Expected mutability annotation /*mu*/ for this argument.

  function reset(/*mu*/tup: [/*mu*/User, number], count: number) {
    tup[0].name = ""
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

// Case: Compile-time invocation annotation: default and optional params
function case_invocAnnot_defaultAndOptional() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  resetDefault(/*mu*/user) // ✅
  resetDefault(user) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetDefault() // ✅
  resetDefault(undefined) // ✅
  resetDefault(/*mu*/undefined) // warning(undefined): Expected no mutability annotation for this argument.

  maybeStore(/*um*/user) // ✅
  maybeStore(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  maybeStore(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  maybeStore() // ✅

  function resetDefault(/*mu*/user: User = { name: 'fallback', location: { street: 'bog' } }) {
    user.name = ""
  }

  let _user: User | undefined

  function maybeStore(/*um*/user?: User) {
    _user = user
  }
}

// Case: Compile-time invocation annotation: overload signatures
function case_invocAnnot_overloads() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  overloaded(user) // ✅
  overloaded(/*mu*/user) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  overloaded(/*mu*/user, 1) // ✅
  overloaded(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  function overloaded(user: User): string
  function overloaded(/*mu*/user: User, count: number): string
  function overloaded(user: User, count?: number): string {
    if (count != null) user.name = ""
    return user.name
  }

  overridden(/*mu*/user, 1) // ✅
  overridden(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  function overridden(/*mu*/user: User, count: number): string
  function overridden(user: User, count: number): string
  function overridden(user: User, count: number): string {
    if (count != null) user.name = ""
    return user.name
  }
}

// Case: Compile-time invocation annotation: constructors and super
function case_invocAnnot_constructors() {
  const user = { name: 'kermit', location: { street: 'swamp' } }


  class Store {
    constructor(public /*um*/user: User) { }
  }

  class Base {
    constructor(public /*mu*/user: User) {
      user.name = ""
    }
  }

  class ChildGood extends Base {
    constructor(/*mu*/user: User) {
      super(/*mu*/user) // ✅
    }
  }

  class ChildBad extends Base {
    constructor(user: User) {
      super(user) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
    }
  }

  new Store(/*um*/user) // ✅
  new Store(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  new Store(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  new ChildGood(/*mu*/user) // ✅
  new ChildGood(user) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  new ChildBad(user) // ✅
}

// Case: Compile-time invocation annotation: optional chaining and computed calls
function case_invocAnnot_optionalAndComputedCalls() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const maybeApp: App | null = new App()
  const key = 'reset' as const

  maybeApp?.reset(/*mu*/user, 1) // ✅
  maybeApp?.reset(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  maybeApp[key](/*mu*/user, 1) // ✅
  maybeApp[key](user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
}

// Case: Compile-time invocation annotation: aliased function values
function case_invocAnnot_aliases() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const resetAlias = resetExport
  const { reset: resetDestructured } = createFunctions()

  resetAlias(/*mu*/user, 1) // ✅
  resetAlias(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  resetDestructured(/*mu*/user, 1) // ✅
  resetDestructured(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
}

// Case: Compile-time invocation annotation: namespace and indirection calls
function case_invocAnnot_namespaceIndirection() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const ns = mutabilityExport
  const reexport = { ns }

  ns.resetExport(/*mu*/user, 1) // ✅
  ns.resetExport(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  reexport.ns.resetExport(/*mu*/user, 1) // ✅
  reexport.ns.resetExport(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
}

// Case: Compile-time invocation annotation: spread and object merge packs
function case_invocAnnot_spreadPacks() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const base = { count: 2 }

  reset({ ...base, /*mu*/user }, 1) // ✅
  reset({ ...base, user }, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  store({ ...base, /*um*/user }, 1) // ✅
  store({ ...base, user }, 1) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  function reset(pack: {/*mu*/user: User, count: number }, count: number) {
    pack.user.name = ""
  }

  let _user: User

  function store(pack: {/*um*/user: User, count: number }, count: number) {
    _user = pack.user
  }
}

// Case: Compile-time invocation annotation: deep nested packs
function case_invocAnnot_deepPacks() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset({ payload: {/*mu*/user }, count: 1 }) // ✅
  reset({ payload: { user }, count: 1 }) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  store({ payload: {/*um*/user }, count: 1 }) // ✅
  store({ payload: { user }, count: 1 }) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  function reset(pack: { payload: {/*mu*/user: User }, count: number }) {
    pack.payload.user.name = ""
  }

  let _user: User

  function store(pack: { payload: {/*um*/user: User }, count: number }) {
    _user = pack.payload.user
  }
}

// Case: Compile-time invocation annotation: readonly wrappers
function case_invocAnnot_readonlyWrappers() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  resetReadonly(/*mu*/user, [/*mu*/user, 1]) // ✅
  resetReadonly(user, [/*mu*/user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetReadonly(/*mu*/user, [user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  function resetReadonly(/*mu*/user: Readonly<User>, tup: readonly [/*mu*/User, number]) {
    return [user.name, tup[0].name]
  }
}

// Case: Compile-time invocation annotation: multiple mutable arguments
function case_invocAnnot_multipleMutableArgs() {
  const user = { name: 'kermit', location: { street: 'swamp' } }
  const userB = { name: 'sir robin', location: { street: 'well' } }

  pair(/*mu*/user, /*um*/userB) // ✅
  pair(user, /*um*/userB) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  pair(/*mu*/user, userB) // ⚠️ warning(userB): Expected mutability annotation /*um*/ for this argument.
  pair(user, userB) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  // ⚠️ warning(userB): Expected mutability annotation /*um*/ for this argument.

  function pair(/*mu*/left: User, /*um*/right: User) {
    left.name = ""
    users.push(right)
  }

  const users: User[] = []
}

// Case: Compile-time invocation annotation: valid annotation syntax
function case_validAnnot() {
  const user = { name: 'kermit', location: { street: 'swamp' } }

  reset(/*mu*/user, 1) // ✅
  reset(/*um*//*mu*/user, 1) // ✅
  reset(/*mu*//*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(/*m u*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(user/*mu*/, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(/*mu */user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(/* mu */user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset(/* mu*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  store(/*um*/user) // ✅
  store(/*mu*//*um*/user) // ✅
  store(/*um*//*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(user/*um*/) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(/*um */user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(/* um */user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store(/* um*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

  function reset(/*mu*/user: User, count: number) {
    user.name = ""
  }

  let _user: User

  function store(/*um*/user: User) {
    _user = user
  }
}


function case_invocAnnot_this() {
  const app = new App()
  const appA = { count: 0 }
  const appC = { count: 0 }
  const user = { name: 'kermit', location: { street: 'bayou' } }

  app.increment.apply(/*mu*/appA) // ✅
  app.increment.apply(appA) // ⚠️ warning(appA): Expected mutability annotation /*mu*/ for this argument.


  app.isNegative.apply(appA) // ✅
  app.isNegative.apply(/*mu*/appC) // ⚠️ warning(appC): Expected no mutability annotation for this argument.


  app.reset.apply(appA, [/*mu*/user, 1]) // ✅
  app.reset.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  app.reset.apply(appA, [user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.



  app.readName.apply(appA, [user, 1]) // ✅
  app.readName.apply(appA, [/*mu*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  app.readName.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.


  app.store.apply(appA, [/*um*/user]) // ✅
  app.store.apply(appA, [/*mu*/user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  app.store.apply(appA, [user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  const increment = app.increment
  const isNegative = app.isNegative
  const reset = app.reset
  const readName = app.readName
  const store = app.store

  increment.apply(/*mu*/appA) // ✅
  increment.apply(appA) // ⚠️ warning(appA): Expected mutability annotation /*mu*/ for this argument.

  isNegative.apply(appA) // ✅
  isNegative.apply(/*mu*/appA) // ⚠️ warning(appA): Expected no mutability annotation for this argument.

  reset.apply(appA, [/*mu*/user, 1]) // ✅
  reset.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset.apply(appA, [user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.


  readName.apply(appA, [user, 1]) // ✅
  readName.apply(appA, [/*mu*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.


  store.apply(appA, [/*um*/user]) // ✅
  store.apply(appA, [/*mu*/user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store.apply(appA, [user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

}



function case_invocAnnot_thisExplicit() {
  const app = new AppExplicit()
  const appA = { count: 0, users: [] }
  const user = { name: 'kermit', location: { street: 'bayou' } }

  app.increment.apply(/*mu*/appA) // ✅
  app.increment.apply(appA) // ⚠️ warning(appA): Expected mutability annotation /*mu*/ for this argument.


  app.store.apply(/*mu*/appA, [/*um*/user]) // ✅
  app.store.apply(/*mu*/appA, [/*mu*/user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  app.store.apply(/*mu*/appA, [user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  const increment = app.increment
  const store = app.store

  increment.apply(/*mu*/appA) // ✅
  increment.apply(appA) // ⚠️ warning(appA): Expected mutability annotation /*mu*/ for this argument.


  store.apply(/*mu*/appA, [/*um*/user]) // ✅
  store.apply(/*mu*/appA, [/*mu*/user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store.apply(/*mu*/appA, [user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

}


function case_invocAnnot_thisObjectLiteral() {
  const app = singleton
  const appA = { count: 0 }
  const appC = { count: 0 }
  const user = { name: 'kermit', location: { street: 'bayou' } }

  app.increment.apply(/*mu*/appA) // ✅
  app.increment.apply(appA) // ⚠️ warning(appA): Expected mutability annotation /*mu*/ for this argument.


  app.isNegative.apply(appA) // ✅
  app.isNegative.apply(/*mu*/appC) // ⚠️ warning(appC): Expected no mutability annotation for this argument.


  app.reset.apply(appA, [/*mu*/user, 1]) // ✅
  app.reset.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  app.reset.apply(appA, [user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.



  app.readName.apply(appA, [user, 1]) // ✅
  app.readName.apply(appA, [/*mu*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  app.readName.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.


  app.store.apply(/*mu*/appA, [/*um*/user]) // ✅
  app.store.apply(/*mu*/appA, [/*mu*/user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  app.store.apply(/*mu*/appA, [user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.


  const increment = app.increment
  const isNegative = app.isNegative
  const reset = app.reset
  const readName = app.readName
  const store = app.store

  increment.apply(/*mu*/appA) // ✅
  increment.apply(appA) // ⚠️ warning(appA): Expected mutability annotation /*mu*/ for this argument.

  isNegative.apply(appA) // ✅
  isNegative.apply(/*mu*/appA) // ⚠️ warning(appA): Expected no mutability annotation for this argument.

  reset.apply(appA, [/*mu*/user, 1]) // ✅
  reset.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  reset.apply(appA, [user, 1]) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.


  readName.apply(appA, [user, 1]) // ✅
  readName.apply(appA, [/*mu*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readName.apply(appA, [/*um*/user, 1]) // ⚠️ warning(user): Expected no mutability annotation for this argument.


  store.apply(/*mu*/appA, [/*um*/user]) // ✅
  store.apply(/*mu*/appA, [/*mu*/user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  store.apply(/*mu*/appA, [user]) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.

}

// Case: Compile-time invocation annotation: bind
function case_invocAnnot_bind() {
  const app = new App()
  const appB = { count: 0, users: [] }
  const user = { name: 'kermit', location: { street: 'bayou' } }

  const incrementBound = app.increment.bind(appB) // mu:that
  const isNegativeBound = app.isNegative.bind(appB)
  const resetBound = app.reset.bind(appB)
  const readNameBound = app.readName.bind(appB)
  const storeBound = app.store.bind(appB) // mu:that

  incrementBound() // ✅

  isNegativeBound() // ✅

  resetBound(/*mu*/user, 1) // ✅
  resetBound(/*um*/user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.
  resetBound(user, 1) // ⚠️ warning(user): Expected mutability annotation /*mu*/ for this argument.

  readNameBound(user, 1) // ✅
  readNameBound(/*mu*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.
  readNameBound(/*um*/user, 1) // ⚠️ warning(user): Expected no mutability annotation for this argument.

  storeBound(/*um*/user) // ✅
  storeBound(/*mu*/user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
  storeBound(user) // ⚠️ warning(user): Expected mutability annotation /*um*/ for this argument.
}

// function case_invocAnnot_that() {
//     const incB = app.increment.bind(appB)
//   const increment = app.increment
//   const incBound = increment.bind(appB) // mu:that

//   function foo(increment: (/*mu:that*/) => void) {
//     increment()
//   }

//   foo(incBound)  // ✅
// }