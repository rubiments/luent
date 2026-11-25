import { RuleTester } from "eslint";
import { describe, it } from "vitest";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkInvocationBoundary } from "./check-invocation-boundary.ts";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const prelude = `
type User = { name: string; location: { street: string } };
`;
const thisDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureConsumerFile = path.join(thisDir, "__fixtures__", "cross-file-consumer.ts");

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts", "*.tsx", "src/rules/__fixtures__/*.ts"],
        maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 200
      }
    }
  }
});

tester.run("check-invocation-boundary", checkInvocationBoundary, {
  valid: [
    {
      filename: "case_invocAnnot.ts",
      code: `
${prelude}
function reset(/*mu*/user: User, count: number) {}
function readName(user: User, count: number) { return user.name; }
function store(/*um*/user: User) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*mu*/user, 1);
  readName(user, 1);
  store(/*um*/user);
}
`
    },
    {
      filename: "case_invocAnnot_noInvalid.ts",
      code: `
${prelude}
function foo(
  count: number,
  /*mu*/user: User,
  nah: null,
  sym: symbol,
  /*um*/userB: User,
) {}

function fooUnion(/*mu*/item: User | number, /*um*/userB: User) {}
function fooGeneric<T>(/*mu*/item: T) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const userB = { name: "robin", location: { street: "well" } };
  foo(1, /*mu*/user, null, Symbol(), /*um*/userB);
  fooUnion(/*mu*/user, /*um*/userB);
  fooUnion(1, /*um*/userB);
  fooGeneric(/*mu*/user);
}
`
    },
    {
      filename: "case_invocAnnot_parameterPack.ts",
      code: `
${prelude}
function reset(pack: {/*mu*/user: User; count: number}, count: number) {}
function readName(pack: {user: User; count: number}, count: number) {}
function store(pack: {/*um*/user: User; count: number}, count: number) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset({/*mu*/user, count: 2}, 1);
  readName({user, count: 2}, 1);
  store({/*um*/user, count: 2}, 1);
}
`
    },
    {
      filename: "case_invocAnnot_deepPacks.ts",
      code: `
${prelude}
function reset(pack: { payload: {/*mu*/user: User }; count: number }) {}
function store(pack: { payload: {/*um*/user: User }; count: number }) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset({ payload: {/*mu*/user }, count: 1 });
  store({ payload: {/*um*/user }, count: 1 });
}
`
    },
    {
      filename: "case_invocAnnot_parameterPack_noninline.ts",
      code: `
${prelude}
type PackMu = {/*mu*/user: User; count: number };
type Pack = {user: User; count: number };
type PackUm = {/*um*/user: User; count: number };

function reset(pack: PackMu, count: number) { pack.user.name = ""; }
function readName(pack: Pack, count: number) { return pack.user.name; }
function store(pack: PackUm, count: number) { void pack; void count; }

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset({user, count: 2}, 1);
  readName({user, count: 2}, 1);
  store({user, count: 2}, 1);
}
`
    },
    {
      filename: "case_invocAnnot_parameter_v_parameterPack.ts",
      code: `
${prelude}
function reset(/*mu*/pack: {/*mu*/user: User; count: number}, count: number) {
  pack.user.name = "";
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*mu*/{user, count: 2}, 1);
}
`
    },
    {
      filename: "case_invocAnnot_tuples.ts",
      code: `
${prelude}
function reset(tup: [/*mu*/User, number], count: number) {}
function readName(tup: [User, number], count: number) {}
function store(tup: [/*um*/User, number], count: number) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset([/*mu*/user, 2], 1);
  readName([user, 2], 1);
  store([/*um*/user, 2], 1);
}
`
    },
    {
      filename: "case_invocAnnot_parameter_v_tuple.ts",
      code: `
${prelude}
function reset(/*mu*/tup: [/*mu*/User, number], count: number) {
  tup[0].name = "";
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*mu*/[user, 2], 1);
}
`
    },
    {
      filename: "case_validAnnot.ts",
      code: `
${prelude}
function reset(/*mu*/user: User, count: number) {}
function store(/*um*/user: User) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*mu*/user, 1);
  reset(/*um*//*mu*/user, 1);
  store(/*um*/user);
  store(/*mu*//*um*/user);
}
`
    },
    {
      filename: "case_invocAnnot_rest.ts",
      code: `
${prelude}
function reset(count: number, ...users: /*mu*/User[]) {}
function readName(count: number, ...users: User[]) {}
function store(count: number, ...users: /*um*/User[]) {}
function resetUnion(count: number, ...users: /*mu*/(User | null)[]) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const userB = { name: "robin", location: { street: "well" } };
  const myUsers = [user, userB];
  reset(0, /*mu*/user, /*mu*/userB);
  readName(0, user, userB);
  store(0, /*um*/user, /*um*/userB);
  reset(0, /*mu*/...myUsers);
  store(0, /*um*/...myUsers);
  resetUnion(0, /*mu*/user, null);
}
`
    },
    {
      filename: "case_invocAnnot_callbacks.ts",
      code: `
${prelude}
function run(
  reset: (/*mu*/user: User, count: number) => void,
  readName: (user: User, count: number) => string,
  store: (/*um*/user: User) => void,
) {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*mu*/user, 1);
  readName(user, 1);
  store(/*um*/user);
}
`
    },
    {
      filename: "case_invocAnnot_callbackParameters.ts",
      code: `
${prelude}
function reset(/*mu*/user: User, count: number) {}
function store(/*um*/user: User) {}
function readName(user: User, count: number) { return user.name; }

function case_invocAnnot_callbackParameters() {
  fooReset(reset);
  fooReset((user, count) => { void user; void count; });
  fooReset((/*um*/user, count) => { void user; void count; });

  fooStore(store);
  fooStore((user) => { void user; });
  fooStore((/*um*/user) => { void user; });

  fooReadName(readName);
  fooReadName((user, count) => \`\${user.name}\${count}\`);

  fooRead(() => true);
  fooRead(function () { return true; });
  fooRead(function (/*mu:this!*/) { return true; });
  fooRead((/*mu:that!*/) => true);

  fooThis(function (/*mu:this*/) {});
  fooThis(() => {});
  fooThis((/*mu:that!*/) => {});
  fooThis(function (/*mu:this/that!*/) {});

  fooThat((/*mu:that*/) => {});
  fooThat(() => {});
  fooThat(function (/*mu:this!*/) {});
  fooThat(function (/*mu:this!/that*/) {});

  fooThisThat((/*mu:this/that*/) => {});
  fooThisThat(function (/*mu:this*/) {});
  fooThisThat(function (/*mu:that*/) {});
}

function fooReset(
  resetCb: (/*mu*/user: User, count: number) => void,
) { void resetCb; }

function fooStore(
  storeCb: (/*um*/user: User) => void,
) { void storeCb; }

function fooReadName(
  readNameCb: (user: User, count: number) => string,
) { void readNameCb; }

function fooRead(
  readCb: () => boolean,
) { void readCb; }

function fooThis(
  incrementCb: (/*mu:this*/) => void,
) { void incrementCb; }

function fooThat(
  incrementCb: (/*mu:that*/) => void,
) { void incrementCb; }

function fooThisThat(
  incrementCb: (/*mu:this/that*/) => void,
) { void incrementCb; }
`
    },
    {
      filename: "case_invocAnnot_callbackParameterPack.ts",
      code: `
${prelude}
function reset(/*mu*/user: User, count: number) {}
function store(/*um*/user: User) {}
function readName(user: User, count: number) { return user.name; }

function case_invocAnnot_callbackParameterPack() {
  fooReset({ reset });
  fooReset({ reset: (user, count) => { void user; void count; } });
  fooReset({ reset: (/*um*/user, count) => { void user; void count; } });

  fooStore({ store });
  fooStore({ store: (user) => { void user; } });
  fooStore({ store: (/*mu!*/user) => { void user; } });

  fooReadName({ readName });
  fooReadName({ readName: (user, count) => \`\${user.name}\${count}\` });
  fooReadName({ readName: (/*um!*/user, count) => \`\${user.name}\${count}\` });
  fooReadName({ readName: (/*mu!*/user, count) => \`\${user.name}\${count}\` });
}

function fooReset(pack: {
  reset: (/*mu*/user: User, count: number) => void,
}) { void pack; }

function fooStore(pack: {
  store: (/*um*/user: User) => void,
}) { void pack; }

function fooReadName(pack: {
  readName: (user: User, count: number) => string,
}) { void pack; }
`
    },
    {
      filename: "case_invocAnnot_higherorder.ts",
      code: `
${prelude}
function createFunctions() {
  return {
    reset(/*mu*/user: User, count: number) {},
    readName(user: User, count: number) { return user.name; },
    store(/*um*/user: User) {},
  };
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const { reset, readName, store } = createFunctions();
  reset(/*mu*/user, 1);
  readName(user, 1);
  store(/*um*/user);
}
`
    },
    {
      filename: "case_invocAnnot_classMethods.ts",
      code: `
${prelude}
class App {
  reset(/*mu*/user: User, count: number) {}
  readName(user: User, count: number) { return user.name; }
  store(/*um*/user: User) {}
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const app = new App();
  app.reset(/*mu*/user, 1);
  app.readName(user, 1);
  app.store(/*um*/user);
}
`
    },
    {
      filename: "case_invocAnnot_this_apply_call.ts",
      code: `
${prelude}
class App {
  users: User[] = [];
  count = 0;

  increment(/*mu:this*/) {
    this.count += 1;
  }

  isNegative() {
    return this.count < 0;
  }

  reset(/*mu*/user: User, count: number) {}
  readName(user: User, count: number) { return user.name; }
  store(/*mu:this*//*um*/user: User) {
    this.users.push(user);
  }
}

function run() {
  const app = new App();
  const appA = { count: 0, users: [] as User[] };
  const user = { name: "kermit", location: { street: "swamp" } };

  app.increment.apply(/*mu*/appA);
  app.increment.call(/*mu*/appA);
  app.isNegative.apply(appA);
  app.isNegative.call(appA);
  app.reset.apply(appA, [/*mu*/user, 1]);
  app.reset.call(appA, /*mu*/user, 1);
  app.readName.apply(appA, [user, 1]);
  app.readName.call(appA, user, 1);
  app.store.apply(/*mu*/appA, [/*um*/user]);
  app.store.call(/*mu*/appA, /*um*/user);

  const increment = app.increment;
  const reset = app.reset;
  increment.apply(/*mu*/appA);
  reset.call(appA, /*mu*/user, 1);
}
`
    },
    {
      filename: "case_invocAnnot_thisExplicit_apply_call.ts",
      code: `
${prelude}
class AppExplicit {
  users: User[] = [];
  count = 0;

  increment(/*mu*/this: { count: number }) {
    this.count += 1;
  }

  store(/*mu*/this: { users: User[] }, /*um*/user: User) {
    this.users.push(user);
  }
}

function run() {
  const app = new AppExplicit();
  const appA = { count: 0, users: [] as User[] };
  const user = { name: "kermit", location: { street: "swamp" } };

  app.increment.apply(/*mu*/appA);
  app.increment.call(/*mu*/appA);
  app.store.apply(/*mu*/appA, [/*um*/user]);
  app.store.call(/*mu*/appA, /*um*/user);

  const store = app.store;
  store.apply(/*mu*/appA, [/*um*/user]);
}
`
    },
    {
      filename: "case_invocAnnot_constructors.ts",
      code: `
${prelude}
class Store {
  constructor(public /*um*/user: User) {}
}

class Base {
  constructor(public /*mu*/user: User) {
    user.name = "";
  }
}

class Child extends Base {
  constructor(/*mu*/user: User) {
    super(/*mu*/user);
  }
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  new Store(/*um*/user);
  new Child(/*mu*/user);
}
`
    },
    {
      filename: "case_invocAnnot_literalMethods.ts",
      code: `
${prelude}
const singleton = {
  reset(/*mu*/user: User, count: number) {},
  readName(user: User, count: number) { return user.name; },
  store(/*um*/user: User) {},
};

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  singleton.reset(/*mu*/user, 1);
  singleton.readName(user, 1);
  singleton.store(/*um*/user);
}
`
    },
    {
      filename: "case_invocAnnot_synthMethods.ts",
      code: `
${prelude}
const app = {
  reset(/*mu*/user: User, count: number) {},
  readName(user: User, count: number) { return user.name; },
  store(/*um*/user: User) {},
};

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  app.reset(/*mu*/user, 1);
  app.readName(user, 1);
  app.store(/*um*/user);
}
`
    },
    {
      filename: "case_invocAnnot_importedSynthMethods.ts",
      code: `
${prelude}
const importedApp = {
  reset(/*mu*/user: User, count: number) {},
  readName(user: User, count: number) { return user.name; },
  store(/*um*/user: User) {},
};

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  importedApp.reset(/*mu*/user, 1);
  importedApp.readName(user, 1);
  importedApp.store(/*um*/user);
}
`
    },
    {
      filename: "case_unchecked_nocheck.ts",
      code: `//@mu-nocheck
${prelude}
function reset(/*mu*/user: User, count: number) {}
function readName(user: User, count: number) { return user.name; }
function store(/*um*/user: User) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*um*/user, 1);
  readName(/*mu*/user, 1);
  store(user);
}
`
    },
    {
      filename: fixtureConsumerFile,
      code: `
import {
  resetExport,
  readNameExport,
  storeExport
} from "./cross-file-provider";
import "./cross-file-provider";

type User = { name: string; location: { street: string } };

function run() {
  const user: User = { name: "kermit", location: { street: "swamp" } };
  resetGlobal(/*mu*/user, 1);
  readNameGlobal(user, 1);
  storeGlobal(/*um*/user);

  resetExport(/*mu*/user, 1);
  readNameExport(user, 1);
  storeExport(/*um*/user);
}
`
    }
  ],
  invalid: [
    {
      filename: "invalid_case_invocAnnot.ts",
      code: `
${prelude}
function reset(/*mu*/user: User, count: number) {}
function readName(user: User, count: number) {}
function store(/*um*/user: User) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*um*/user, 1);
  readName(/*mu*/user, 1);
  store(user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_noInvalid.ts",
      code: `
${prelude}
function foo(/*mu*/user: User, name: string) {}
function resetUnion(/*mu*/value: User | null) {}
function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  foo(/*um*/user, "name");
  foo(user, /*mu*/"robin");
  resetUnion(/*mu*/null);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedNoAnnotation" }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_parameterPack.ts",
      code: `
${prelude}
function reset(pack: {/*mu*/user: User; count: number}, count: number) {}
function readName(pack: {user: User; count: number}, count: number) {}
function store(pack: {/*um*/user: User; count: number}, count: number) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset({/*um*/user, count: 2}, 1);
  readName({/*mu*/user, count: 2}, 1);
  store({user, count: 2}, 1);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_deepPacks.ts",
      code: `
${prelude}
function reset(pack: { payload: {/*mu*/user: User }; count: number }) {}
function store(pack: { payload: {/*um*/user: User }; count: number }) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset({ payload: { user }, count: 1 });
  store({ payload: { user }, count: 1 });
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_parameterPack_noninline.ts",
      code: `
${prelude}
type PackMu = {/*mu*/user: User; count: number };
type Pack = {user: User; count: number };
type PackUm = {/*um*/user: User; count: number };

function reset(pack: PackMu, count: number) { pack.user.name = ""; }
function readName(pack: Pack, count: number) { return pack.user.name; }
function store(pack: PackUm, count: number) { void pack; void count; }

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset({/*mu*/user, count: 2}, 1);
  readName({/*um*/user, count: 2}, 1);
  store({/*mu*/user, count: 2}, 1);
}
`,
      errors: [
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedNoAnnotation" }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_argumentPack_noninline.ts",
      code: `
${prelude}
function reset(pack: {/*mu*/user: User; count: number}, count: number) {
  pack.user.name = "";
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const pack = {/*mu*/user, count: 2};
  reset(pack, 1);
}
`,
      errors: [
        {
          messageId: "expectedPackPropertyAnnotation",
          data: { expected: "mu", key: "user" }
        }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_parameter_v_parameterPack.ts",
      code: `
${prelude}
function reset(/*mu*/pack: {/*mu*/user: User; count: number}, count: number) {
  pack.user.name = "";
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset({/*mu*/user, count: 2}, 1);
  reset({/*um*/user, count: 2}, 1);
  reset({user, count: 2}, 1);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "mu" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_tuples.ts",
      code: `
${prelude}
function reset(tup: [/*mu*/User, number], count: number) {}
function readName(tup: [User, number], count: number) {}
function store(tup: [/*um*/User, number], count: number) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset([/*um*/user, 2], 1);
  reset([user, 2], 1);
  readName([/*mu*/user, 2], 1);
  store([/*mu*/user, 2], 1);
  store([user, 2], 1);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_parameter_v_tuple.ts",
      code: `
${prelude}
function reset(/*mu*/tup: [/*mu*/User, number], count: number) {
  tup[0].name = "";
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset([/*mu*/user, 2], 1);
  reset([/*um*/user, 2], 1);
  reset([user, 2], 1);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "mu" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_tuples_noninline.ts",
      code: `
${prelude}
function reset(tup: readonly [/*mu*/User, number], count: number) {
  tup[0].name = "";
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const tuple = [/*mu*/user, 2] as const;
  reset(tuple, 1);
}
`,
      errors: [
        {
          messageId: "expectedTupleIndexAnnotation",
          data: { expected: "mu", index: "1" }
        }
      ]
    },
    {
      filename: "invalid_case_validAnnot.ts",
      code: `
${prelude}
function reset(/*mu*/user: User, count: number) {}
function store(/*um*/user: User) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(/*mu*//*um*/user, 1);
  reset(/*m u*/user, 1);
  reset(user/*mu*/, 1);
  reset(/*mu */user, 1);
  reset(/* mu */user, 1);
  reset(/* mu*/user, 1);

  store(/*um*//*mu*/user);
  store(user/*um*/);
  store(/*um */user);
  store(/* um */user);
  store(/* um*/user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_rest.ts",
      code: `
${prelude}
function reset(count: number, ...users: /*mu*/User[]) {}
function readName(count: number, ...users: User[]) {}
function store(count: number, ...users: /*um*/User[]) {}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const userB = { name: "robin", location: { street: "well" } };
  const myUsers = [user, userB];
  reset(0, user, /*mu*/userB);
  readName(0, /*mu*/user, userB);
  store(0, ...myUsers);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_callbacks.ts",
      code: `
${prelude}
function run(
  reset: (/*mu*/user: User, count: number) => void,
  readName: (user: User, count: number) => string,
  store: (/*um*/user: User) => void,
) {
  const user = { name: "kermit", location: { street: "swamp" } };
  reset(user, 1);
  readName(/*um*/user, 1);
  store(/*mu*/user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_callbackParameters.ts",
      code: `
type User = { name: string; location: { street: string } };

function case_invocAnnot_callbackParameters() {
  fooStore((/*mu*/user) => { void user; });
  fooReadName((/*um*/user, count) => \`\${user.name}\${count}\`);
  fooReadName((/*mu*/user, count) => \`\${user.name}\${count}\`);
  fooRead(function (/*mu:this*/) { return true; });
  fooRead((/*mu:that*/) => true);
  fooRead(function (/*mu:this/that*/) { return true; });

  fooThis((/*mu:that*/) => {});
  fooThis(function (/*mu:this/that*/) {});

  fooThat(function (/*mu:this*/) {});
  fooThat(function (/*mu:this/that*/) {});
}

function fooStore(
  storeCb: (/*um*/user: User) => void,
) { void storeCb; }

function fooReadName(
  readNameCb: (user: User, count: number) => string,
) { void readNameCb; }

function fooRead(
  readCb: () => boolean,
) { void readCb; }

function fooThis(
  incrementCb: (/*mu:this*/) => void,
) { void incrementCb; }

function fooThat(
  incrementCb: (/*mu:that*/) => void,
) { void incrementCb; }
`,
      errors: [
        {
          messageId: "incompatibleMutabilityAnnotation",
          line: 5,
          column: 19,
          endLine: 5,
          endColumn: 23
        },
        {
          messageId: "expectedNoAnnotation",
          line: 6,
          column: 22,
          endLine: 6,
          endColumn: 26
        },
        {
          messageId: "expectedNoAnnotation",
          line: 7,
          column: 22,
          endLine: 7,
          endColumn: 26
        },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedNoAnnotation" },
        { messageId: "incompatibleMutabilityAnnotation" },
        { messageId: "incompatibleMutabilityAnnotation" },
        { messageId: "incompatibleMutabilityAnnotation" },
        { messageId: "incompatibleMutabilityAnnotation" }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_callbackParameterPack.ts",
      code: `
${prelude}
function case_invocAnnot_callbackParameterPack() {
  fooStore({ store: (/*mu*/user) => { void user; } });
  fooReadName({ readName: (/*um*/user, count) => \`\${user.name}\${count}\` });
  fooReadName({ readName: (/*mu*/user, count) => \`\${user.name}\${count}\` });
}

function fooStore(pack: {
  store: (/*um*/user: User) => void,
}) { void pack; }

function fooReadName(pack: {
  readName: (user: User, count: number) => string,
}) { void pack; }
`,
      errors: [
        { messageId: "incompatibleMutabilityAnnotation" },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedNoAnnotation" }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_higherorder.ts",
      code: `
${prelude}
function createFunctions() {
  return {
    reset(/*mu*/user: User, count: number) {},
    readName(user: User, count: number) { return user.name; },
    store(/*um*/user: User) {},
  };
}
function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const { reset, readName, store } = createFunctions();
  reset(/*um*/user, 1);
  readName(/*mu*/user, 1);
  store(user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_classMethods.ts",
      code: `
${prelude}
class App {
  reset(/*mu*/user: User, count: number) {}
  readName(user: User, count: number) { return user.name; }
  store(/*um*/user: User) {}
}
function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  const app = new App();
  app.reset(user, 1);
  app.readName(/*mu*/user, 1);
  app.store(/*mu*/user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_this_apply_call.ts",
      code: `
${prelude}
class App {
  users: User[] = [];
  count = 0;

  increment(/*mu:this*/) {
    this.count += 1;
  }

  isNegative() {
    return this.count < 0;
  }

  reset(/*mu*/user: User, count: number) {}
  readName(user: User, count: number) { return user.name; }
  store(/*mu:this*//*um*/user: User) {
    this.users.push(user);
  }
}

function run() {
  const app = new App();
  const appA = { count: 0, users: [] as User[] };
  const user = { name: "kermit", location: { street: "swamp" } };

  app.increment.apply(appA);
  app.isNegative.call(/*mu*/appA);
  app.reset.apply(appA, [/*um*/user, 1]);
  app.readName.call(appA, /*um*/user, 1);
  app.store.call(/*mu*/appA, user);

  const store = app.store;
  store.apply(/*um*/appA, [/*mu*/user]);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_thisExplicit_apply_call.ts",
      code: `
${prelude}
class AppExplicit {
  users: User[] = [];
  count = 0;

  increment(/*mu*/this: { count: number }) {
    this.count += 1;
  }

  store(/*mu*/this: { users: User[] }, /*um*/user: User) {
    this.users.push(user);
  }
}

function run() {
  const app = new AppExplicit();
  const appA = { count: 0, users: [] as User[] };
  const user = { name: "kermit", location: { street: "swamp" } };

  app.increment.call(appA);
  app.store.apply(/*um*/appA, [/*mu*/user]);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_constructors.ts",
      code: `
${prelude}
class Store {
  constructor(public /*um*/user: User) {}
}

class Base {
  constructor(public /*mu*/user: User) {
    user.name = "";
  }
}

class Child extends Base {
  constructor(/*mu*/user: User) {
    super(user);
  }
}

function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  new Store(/*mu*/user);
  new Store(user);
  new Child(user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_literalMethods.ts",
      code: `
${prelude}
const singleton = {
  reset(/*mu*/user: User, count: number) {},
  readName(user: User, count: number) { return user.name; },
  store(/*um*/user: User) {},
};
function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  singleton.reset(user, 1);
  singleton.readName(/*um*/user, 1);
  singleton.store(/*mu*/user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_synthMethods.ts",
      code: `
${prelude}
const app = {
  reset(/*mu*/user: User, count: number) {},
  readName(user: User, count: number) { return user.name; },
  store(/*um*/user: User) {},
};
function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  app.reset(user, 1);
  app.readName(/*mu*/user, 1);
  app.store(user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: "invalid_case_invocAnnot_importedSynthMethods.ts",
      code: `
${prelude}
const importedApp = {
  reset(/*mu*/user: User, count: number) {},
  readName(user: User, count: number) { return user.name; },
  store(/*um*/user: User) {},
};
function run() {
  const user = { name: "kermit", location: { street: "swamp" } };
  importedApp.reset(/*um*/user, 1);
  importedApp.readName(/*mu*/user, 1);
  importedApp.store(user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    },
    {
      filename: fixtureConsumerFile,
      code: `
import {
  resetExport,
  readNameExport,
  storeExport
} from "./cross-file-provider";
import "./cross-file-provider";

type User = { name: string; location: { street: string } };

function run() {
  const user: User = { name: "kermit", location: { street: "swamp" } };
  resetGlobal(/*um*/user, 1);
  resetGlobal(user, 1);
  readNameGlobal(/*mu*/user, 1);
  storeGlobal(/*mu*/user);
  storeGlobal(user);

  resetExport(/*um*/user, 1);
  resetExport(user, 1);
  readNameExport(/*mu*/user, 1);
  storeExport(/*mu*/user);
  storeExport(user);
}
`,
      errors: [
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedAnnotation", data: { expected: "mu" } },
        { messageId: "expectedNoAnnotation" },
        { messageId: "expectedAnnotation", data: { expected: "um" } },
        { messageId: "expectedAnnotation", data: { expected: "um" } }
      ]
    }
  ]
});
