import { CellType, TagType, NamespaceName } from '../interfaces/ehtag';
import { Database } from '../database';
import { parseFragment, serialize } from 'parse5';
import { renderText } from './text-renderer';
import { parseTreeAdapter, serializeTreeAdapter, DocumentFragment } from './html-tree-adapter';
import { normalizeAst } from './ast-normalizer';
import { renderMd } from './md-renderer';
import { parseMd } from './md-parser';

export interface ParseResult {
    raw: string;
    doc: DocumentFragment;
    context: Context;
}

export interface Context {
    database: Database;
    namespace: NamespaceName;
    raw: string;
}

function parseImpl(src: string, context: Context): ParseResult {
    const html = parseMd(src);
    const doc = parseFragment(html, { treeAdapter: parseTreeAdapter }) as DocumentFragment;
    normalizeAst(doc.content);
    return { doc, context, raw: src };
}

export function normalize(src: string, context: Context): string {
    const r = parseImpl(src, context);
    return renderMd(r.doc.content);
}

export function parse(src: string, context: Context): ParseResult {
    src = normalize(src, context);
    return parseImpl(src, context);
}

export const render = <T extends TagType>(parsed: ParseResult, target: T): CellType<T> => {
    if (target === 'ast') return parsed.doc.content as CellType<T>;
    if (target === 'raw') return parsed.raw as CellType<T>;
    if (target === 'html') return serialize(parsed.doc, { treeAdapter: serializeTreeAdapter }) as CellType<T>;
    if (target === 'text') return renderText(parsed.doc.content) as CellType<T>;
    return {
        ast: render(parsed, 'ast'),
        html: render(parsed, 'html'),
        raw: render(parsed, 'raw'),
        text: render(parsed, 'text'),
    } as CellType<T>;
};
