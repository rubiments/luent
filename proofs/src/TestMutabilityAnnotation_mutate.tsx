import { fromContext, ContextKey, MU, FromTag } from 'luent'

// Case: mutable and read-only imports
import { /*mu*/singleton, userSingleton } from './TestMutabilityAnnotationExport'

singleton.count = 0 // ✅
userSingleton.name = '' // ⚠️ warning(userSingleton): Cannot mutate unannotated non-local object 'userSingleton'.


type User = { name: string, location: { street: string } }

type mu<T extends object> = HasUndefinedValue<T> extends true ? MuOr<T> : { mu: T }

type MuOr<T> = { mu?: T } &
{ [K in keyof T as T[K] extends undefined ? never : K]: T[K] } &
{ [K in keyof T as T[K] extends undefined ? K : never]?: T[K] }

type HasUndefinedValue<T extends object> =
  { [K in keyof T]-?: undefined extends T[K] ? true : never }[keyof T] extends never
  ? false
  : true

const USER = ContextKey<User>()

const user = { name: 'kermit', location: { street: 'bayou' } }

type v<T> = T & { '~accessed': true }

function v<T extends object>(value: T): v<T> {
  return value as v<T>;
}

function getUser() {
  return v(user)
}

function getUserKit() {
  return { user: v(user) }
}

// Case: Mutable: nesting
// Case: Mutable: scope nesting

// Case: rest parameters are mutable owned objects

// Case: assignment operators
// Case: functions with /*mu*/
// Case: functions with /*um*/
// Case: methods with /*mu:this*/

// Case: Escaped owned object is a borrowed object if returned

// Case: Mutable params: accessed

// Case: Escaped borrowed object

// Case: Mutable owned object

// Case: Readonly borrowed object

// Case: Mutable borrowed object: All annotation syntaxes
function case_declareAnnot_mutableBorrowed() {

  // Annotation syntax: /*mu*/
  function reset(/*mu*/user: User) {
    user.name = '' // ✅
  }

  // Parameter pack
  // Annotation syntax: /*mu*/
  function resetPack(pack: {/*mu*/user: User }) {
    const { user } = pack;
    user.name = '' // ✅
  }


  // Runtime annotation

  // Annotation syntax: { mu: Type, ... } // type annotation
  function resetMuAnnot(pack: { mu: User }) {
    const { mu: user } = pack

    user.name = '' // ✅
  }

  // Annotation syntax: { mu: Type, ... } // type annotation
  function resetMuAnnotDe({ mu: user }: { mu: User }) {
    user.name = '' // ✅
  }

  // Annotation syntax: { mu: { ... }, ... } // type annotation
  function resetMuObj(pack: { mu: { user: User } }) {
    const { mu: { user } } = pack
    user.name = '' // ✅
  }

  // Annotation syntax: { mu: { ... }, ... } // type annotation
  function resetMuObjDestructure({ mu: { user }, count }: { mu: { user: User }, count: number }) {
    user.name = '' // ✅
  }



  // Runtime annotation with type utility

  // Annotation syntax: mu<{ ... }>
  function resetMuType(pack: mu<{ user: User }> & { count: number }) {
    const { mu: { user }, count } = pack
    user.name = '' // ✅
  }

  // Annotation syntax: mu<{ ... }>
  function resetMuObjOpt({ mu, user }: mu<{ user?: User }>) {
    if (user) console.log('user', user.name)
    if (mu?.user) {
      mu.user.name = "" // ✅
    }
  }


  // Runtime annotation with de-flattening type utility

  // Annotation syntax: Helper<{ 'mu:key': value, 'mu:key2': value2 }>
  // - where helper transforms T into { mu: { key: value, key2: value } }
  function resetSetup(setup: FromTag<{
    'mu:user': User
  }>) {
    const { mu: { user } } = setup
    user.name = '' // ✅
  }


  // Context entry variable declaration via context key
  // Annotation syntax: MU(KEY) 
  // - where KEY is branded { '~context-key': true }
  // - MU(KEY) is passed into a function that returns a value.
  function resetContextKey() {
    const user = fromContext(MU(USER))
    user.name = '' // ✅
  }

  
  // Accessor
  // Annotation syntax: /*mu*/
  function resetAccessor() {
    const /*mu*/user = getUser();
    user.name = '' // ✅
  }

  // Annotation syntax: /*mu*/
  function resetAccessorDestructure() {
    const { /*mu*/user } = getUserKit();
    user.name = ''
  }

  async function resetDynamicImport() {
    const { /*mu*/singleton } = await import('./TestMutabilityAnnotationExport')
    singleton.count = 0; // ✅
  }

}

// Case: Mutable: Annotations are only valid inline with the declaration
function case_declareAnnot_mutable_noninline() {

  type Pack = {/*mu*/user: User }
  type PackMu = { mu: { user: User } }
  type PackMuType = mu<{ user: User }> & { count: number }
  type PackMuOr = mu<{ user?: User }>

  // Parameter pack
  function resetPack(pack: Pack) {
    const { user } = pack;
    user.name = '' // ⚠️ warning(user): Cannot mutate unannotated non-local object 'user'.
  }

  // Runtime annotation

  function resetMuObj(pack: PackMu) {
    const { mu: { user } } = pack
    user.name = '' // ⚠️ warning(user): Cannot mutate unannotated non-local object 'user'.
  }

  function resetMuType(pack: PackMuType) {
    const { mu: { user }, count } = pack
    user.name = '' // ⚠️ warning(user): Cannot mutate unannotated non-local object 'user'.
  }

  function resetMuObjOpt({ mu, user }: PackMuOr) {
    if (user) console.log('user', user.name)
    if (mu?.user) {
      mu.user.name = "" // ⚠️ warning(user): Cannot mutate unannotated non-local object 'user'.
    }
  }

  type Setup = FromTag<{
    'mu:user': User
  }>

  // Annotation syntax: Helper<{ 'mu:key': value, 'mu:key2': value2 }>
  // - where helper transforms T into { mu: { key: value, key2: value } }
  function resetSetup(setup: Setup) {
    const { mu: { user } } = setup
    user.name = '' // ⚠️ warning(user): Cannot mutate unannotated non-local object 'user'.
  }

  // Context entry variable declaration via context key
  // Annotation syntax: MU(KEY) 
  // - where KEY is branded { '~context-key': true }
  // - MU(KEY) is passed into a function that returns a value.
  function resetContextKey() {
    const key = MU(USER)
    const user = fromContext(key)
    user.name = '' // ⚠️ warning(user): Cannot mutate unannotated non-local object 'user'.
  }

}