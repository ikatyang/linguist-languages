import * as fs from "fs";

export type BaseType = boolean | number | string;
export type BaseTypeOf<T> = T extends boolean
  ? "boolean"
  : T extends number
  ? "number"
  : T extends string
  ? "string"
  : never;

function isBaseType(value: any): value is BaseType {
  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return true;
    default:
      return false;
  }
}

function getBaseType<T extends BaseType>(value: T) {
  return typeof value as BaseTypeOf<T>;
}

export interface BaseField<T extends BaseType> {
  type: BaseTypeOf<T>;
}
export interface ArrayField<T extends BaseType> {
  type: "array";
  subType: BaseTypeOf<T>;
}
export type Field = BaseField<BaseType> | ArrayField<BaseType>;

export function getFieldType<T extends BaseType>(value: T): BaseField<T>;
export function getFieldType<T extends BaseType>(value: T[]): ArrayField<T>;
export function getFieldType<T extends BaseType>(
  value: T | T[]
): BaseField<T> | ArrayField<T> {
  if (isBaseType(value)) {
    return { type: getBaseType(value) };
  }

  // istanbul ignore else
  if (
    Array.isArray(value) &&
    new Set(value.map(x => typeof x)).size === 1 &&
    isBaseType(value[0])
  ) {
    return { type: "array", subType: getBaseType(value[0]) };
  } else {
    throw new Error(`Unexpected value:\n\n${JSON.stringify(value, null, 2)}`);
  }
}

export function indent(value: string) {
  return value
    .split("\n")
    .map(x => `  ${x}`)
    .join("\n");
}
