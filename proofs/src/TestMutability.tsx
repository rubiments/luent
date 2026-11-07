import { FromTag, Ion, ion } from "luent"

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
    <Ru /*mu*/count={$count}></Ru>
    <Mubi mu:count={$count}></Mubi>
    <Mubi mu:count={$count}></Mubi>
    <Mubi mu:count={$num}></Mubi>
  </>
}




type RoMark = { '~ro'?: true }
type MoMark = { '~mo'?: true }
type MuMark = { '~mu'?: true, '~mo'?: true, }

function mo<T>(x: T & MoMark) { return x }
function mu<T>(x: T): T & MuMark { return x }

type MuIon<T> = Ion<T> & MuMark & { value: T }
type MoIon<T> = Ion<T> & MoMark

function Ru(setup: FromTag<{
  count: Ion<number> & RoMark
}>) {
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

const $ct = ion(0)

foo(mu($ct))

foo(/*mu*/$ct)

const count = 1;
const user = { name: 'kermit' }
const userA = { name: 'kermit' }

reset(/*mu*/{ name: 'kermit' }, count)

reset(/*mu*/user, count)

resetThird(/*mu*/user, count)

// mu pack
setup({ /*mu*/user, count })

setup({ /*mu*/user: userA, count })

// optional mupack
opt({ mu: { user }, count })

opt({ user, count })

function reset(user: Mu<User>, count: number) {

}

function resetThird(user: User, count: number) {

}

function setup(obj: { user: Mu<User>, count: number }) { }
function setupThird(obj: { user: User, count: number }) { }

function opt(obj: { mu: { user: User } } | { user: User, count: number }) { }

type Mu<T> = T & MuMark

// Mu<User>
// Mo<User>
// Ro<User>

// Mu<T>