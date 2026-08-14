// @types/node (^20) ainda não inclui os tipos de `node:sqlite` (adicionado em
// versões mais novas do Node, disponível nativamente desde o Node 22.5+ e
// usado aqui na v24). Declaração mínima cobrindo só a API usada neste projeto.
declare module "node:sqlite" {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
