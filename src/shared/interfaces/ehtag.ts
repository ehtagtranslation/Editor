import * as Ast from './ehtag.ast';
import { Opaque } from 'type-fest';

export type Sha1Value = Opaque<string, Commit>;

export const Sha1Value = Object.freeze(
    Object.assign(
        (value: string): Sha1Value | undefined => {
            if (typeof value != 'string') return undefined;
            if (value.length < 40) return undefined;
            value = value.trim().toLowerCase();
            if (value.length !== 40) return undefined;
            return value as Sha1Value;
        },
        {
            empty: '0'.repeat(40) as Sha1Value,
            validate(value: string): value is Sha1Value {
                return typeof value == 'string' && value.length === 40 && value.trim().length === 40;
            },
        },
    ),
);

export interface Signature {
    name: string;
    email: string;
    when: Date;
}

export interface Commit {
    author: Signature;
    committer: Signature;
    sha: Sha1Value;
    message: string;
}

export interface RepoInfo {
    repo: string;
    head: Commit;
    version: number;
    data: NamespaceInfo[];
}

export interface RepoData<T> extends RepoInfo {
    data: Array<NamespaceData<T>>;
}

export const NamespaceName = [
    'rows',
    'reclass',
    'language',
    'parody',
    'character',
    'group',
    'artist',
    'male',
    'female',
    'misc',
] as const;
export type NamespaceName = typeof NamespaceName[number];

export interface NamespaceInfo {
    count: number;
    namespace: NamespaceName;
    frontMatters: FrontMatters;
}

export interface FrontMatters {
    key: NamespaceName;
    name: string;
    description: string;
    copyright?: string;
    rules?: string[];
    example?: Tag<'raw'> & { raw: string };
}

export interface NamespaceData<T = TagType> extends NamespaceInfo {
    data: { [raw: string]: Tag<T> };
}

export interface Tag<T = TagType> {
    name: CellType<T>;
    intro: CellType<T>;
    links: CellType<T>;
}

export type TagType = 'raw' | 'ast' | 'html' | 'text' | 'full';

export type CellType<T> = T extends 'raw'
    ? string
    : T extends 'ast'
    ? Ast.Tree
    : T extends 'html'
    ? string
    : T extends 'text'
    ? string
    : T extends 'full'
    ? { raw: CellType<'raw'>; ast: CellType<'ast'>; html: CellType<'html'>; text: CellType<'text'> }
    : T;
