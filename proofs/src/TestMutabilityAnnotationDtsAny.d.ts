type User = { name: string, location: { street: string } };

export declare function resetDtsAny(/*mu*/user: User, count: number): void;
export declare function readNameDtsAny(user: User, count: number): string;
export declare function storeDtsAny(user: User): void;
