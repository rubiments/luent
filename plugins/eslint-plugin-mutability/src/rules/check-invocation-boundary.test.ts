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
