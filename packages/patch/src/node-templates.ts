import { Kind, NamedTypeNode, NameNode, StringValueNode, TypeNode } from 'graphql';

export function nameNode(name: string): NameNode {
  return {
    value: name,
    kind: Kind.NAME,
  };
}

export function stringNode(value: string): StringValueNode {
  return {
    kind: Kind.STRING,
    value,
  };
}

export function typeNode(name: string): TypeNode {
  return {
    kind: Kind.NAMED_TYPE,
    name: nameNode(name),
  };
}

export function namedTypeNode(name: string): NamedTypeNode {
  return {
    kind: Kind.NAMED_TYPE,
    name: nameNode(name),
  };
}
