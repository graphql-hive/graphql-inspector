import type { ParseOptions, Source } from 'graphql';
import { DocumentNode, GraphQLError, TokenKind, visit } from 'graphql';
import { Parser } from 'graphql/language/parser.js';

class ParserWithLexer extends Parser {
  private __tokenCount = 0;

  get tokenCount() {
    return this.__tokenCount;
  }

  constructor(source: string | Source, options?: ParseOptions) {
    super(source, options);
    const lexer = this._lexer;
    this._lexer = new Proxy(lexer, {
      get: (target, prop, receiver) => {
        if (prop === 'advance') {
          return () => {
            const token = target.advance();
            if (token.kind !== TokenKind.EOF) {
              this.__tokenCount++;
            }
            return token;
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }
}

export function calculateTokenCount(args: {
  source: Source | string;
  getReferencedFragmentSource: (fragmentName: string) => Source | string | undefined;
}): number {
  const parser = new ParserWithLexer(args.source);
  const document = parser.parseDocument();
  let { tokenCount } = parser;

  visit(document, {
    FragmentSpread(node) {
      const fragmentSource = args.getReferencedFragmentSource(node.name.value);
      if (fragmentSource) {
        tokenCount += calculateTokenCount({
          source: fragmentSource,
          getReferencedFragmentSource: args.getReferencedFragmentSource,
        });
      }
    },
  });

  return tokenCount;
}

export function validateTokenCount(args: {
  source: Source;
  document: DocumentNode;
  getReferencedFragmentSource: (fragmentName: string) => Source | string | undefined;
  maxTokenCount: number;
}): GraphQLError | void {
  const tokenCount = calculateTokenCount(args);
  if (tokenCount > args.maxTokenCount) {
    return new GraphQLError(
      `Query exceeds maximum token count of ${args.maxTokenCount} (actual: ${tokenCount})`,
      {
        nodes: args.document,
        source: args.source,
        positions: args.document.loc?.start ? [args.document.loc.start] : undefined,
      },
    );
  }
}
