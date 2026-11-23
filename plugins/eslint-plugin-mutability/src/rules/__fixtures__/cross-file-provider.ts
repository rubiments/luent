export type User = { name: string; location: { street: string } };

declare global {
  function resetGlobal(/*mu*/user: User, count: number): void;
  function readNameGlobal(user: User, count: number): string;
  function storeGlobal(/*um*/user: User): void;
}

export function resetExport(/*mu*/user: User, count: number): void {
  void count;
  user.name = "";
}

export function readNameExport(user: User, count: number): string {
  void count;
  return user.name;
}

export function storeExport(/*um*/user: User): void {
  void user;
}
