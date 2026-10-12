
if (import.meta.env.DEV && !__TEST__) {
   // lazy import to prevent imports from affecting tests
   import('./proofs').then(res => res.runDemo())
}
