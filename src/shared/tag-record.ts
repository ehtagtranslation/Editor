import { Tag, TagType } from './interfaces/ehtag';
import { Cell } from './cell';
import { Context, NamespaceDatabaseView } from './interfaces/database';
import { RawTag, isRawTag } from './validate';

const recordRegex = /^\s*(?<!\\)\|?\s*(?<raw>.*?)\s*(?<!\\)\|\s*(?<name>.*?)\s*(?<!\\)\|\s*(?<intro>.*?)\s*(?<!\\)\|\s*(?<links>.*?)\s*(?<!\\)\|?\s*$/;

const unescapeRe1 = /<br\s*\/?>/g;
const unescapeRe2 = /(?<!\\)((?:\\\\)*)\\\|/g;
function unescape(value: string): string {
    return value.replace(unescapeRe1, '\n').replace(unescapeRe2, '$1|');
}

const escapeRe1 = /(\r\n|\n)/g;
const escapeRe2 = /(?<!\\)(\\\\)*\|/g;
function escape(value: string): string {
    return value.replace(escapeRe1, '<br>').replace(escapeRe2, '\\$&');
}

export class TagRecord implements Tag<Cell> {
    constructor(data: Tag<'raw'>, readonly namespace: NamespaceDatabaseView) {
        this.name = new Cell(data.name.trim());
        this.intro = new Cell(data.intro.trim());
        this.links = new Cell(data.links.trim());
    }
    readonly name: Cell;
    readonly intro: Cell;
    readonly links: Cell;

    stringify(context: Context): string {
        const raw = context.raw?.trim().toLowerCase() ?? '';
        const render = (cell: Cell): string => escape(cell.render('raw', context));
        return `| ${raw} | ${render(this.name)} | ${render(this.intro)} | ${render(this.links)} |`;
    }

    render<T extends TagType>(type: T, context: Context): Tag<T> {
        return {
            name: this.name.render(type, context),
            intro: this.intro.render(type, context),
            links: this.links.render(type, context),
        };
    }

    static parse(line: string, namespace: NamespaceDatabaseView): [RawTag | undefined, TagRecord] | null {
        const match = recordRegex.exec(line);
        if (!match || !match.groups) return null;
        const { name, intro, links } = match.groups;
        const record = new TagRecord(
            {
                name: unescape(name),
                intro: unescape(intro),
                links: unescape(links),
            },
            namespace,
        );
        const raw = match.groups.raw.trim().toLowerCase();
        return [isRawTag(raw) ? raw : undefined, record];
    }

    static unsafeCreate(data: Tag<'raw'>, namespace: NamespaceDatabaseView): TagRecord {
        const tag = new TagRecord(data, namespace);
        data = tag.render('raw', {
            database: namespace.database,
            namespace,
        });
        return new TagRecord(data, namespace);
    }
}