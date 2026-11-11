import { ContextKey, fromContext, FromTag, Ion, ion } from "luent"

function Counter(setup: FromTag<{
  count: MuIon<number>
}>) {
  const { $count } = setup
  const $num = ion(9)
  const $msg = ion('hi')

  return <>
    <input mu:value={$msg} />

    <Ru count={$count}></Ru>
    <Ru count={$count}></Ru>
    <Ru /*mu*/ count={$count}></Ru>
    <Mubi mu:count={$count}></Mubi>
    <Mubi mu:count={$count}></Mubi>
    <Mubi mu:count={$num}></Mubi>
  </>
}


function bar(a: Mu & User) {

}

const myUser: User = { name: 'kermit' }

bar(myUser)

type Ro = { readonly '~mutability'?: 'ro' | 'mo' | 'mu' }
type Mo = { readonly '~mutability'?: 'mo' | 'mu' }
type Mu = { readonly '~mutability'?: 'mu' }

type MuIon<T> = Ion<T> & Mu & { value: T }
type MoIon<T> = Ion<T> & Mo

function Ru(setup: FromTag<{
  count: Ro & Ion<number>
}>) {
  const { $count } = setup
  return <></>
}

function Mubi(setup: FromTag<{
  'mu:count': MuIon<number>
}>) {
  const { mu: { $count } } = setup;
  return <></>
}


function foo($count: MuIon<number>) {

}


// Argument annotations

const $ct = ion(0)

foo(/*~mu*/$ct)

const count = 1;
const user = { name: 'kermit' }
const userA = { name: 'kermit' }

reset(/*~mu*/{ name: 'kermit' }, count)

reset(/*~mu*/user, count)

resetThird(/*~mu*/user, count)

// mu pack
setup({ /*~mu*/user, count })

setup({ /*~mu*/user: userA, count })

// optional mupack
opt({ mu: { user }, count })

opt({ user, count })

function reset(user: Mu & User, count: number) {

}

function resetThird(user: User, count: number) {

}

type Admin = {
  name: string,
  location: Mu & { address: string }
}

function setup(obj: { user: Mu & User, count: number }) { }
function setupAdmin(admin: { name: string, location: Mu & { address: string } }) { }
function setupThird(obj: { user: User, count: number }) { }

function opt(obj: { mu: { user: User } } | { user: User, count: number }) { }


// Mu<User>
// Mo<User>
// Ro<User>

// Mu<T>

const FROG = ContextKey<{ name: string }>()

const frog = fromContext(FROG)