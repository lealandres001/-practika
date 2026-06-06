/* ============================================================
   PRACTIKA API · repositories/base.repository.js
   Repositorio genérico sobre una colección del store JSON.
   ============================================================ */
import { table, persist } from "../data/db.js";

export class BaseRepository {
  constructor(collection) {
    this.collection = collection;
  }

  all() {
    return table(this.collection);
  }

  findById(id) {
    return this.all().find((row) => row.id === id) || null;
  }

  find(predicate) {
    return this.all().filter(predicate);
  }

  /** Inserta al inicio y persiste. */
  insert(row) {
    this.all().unshift(row);
    persist();
    return row;
  }

  /** Guarda cambios hechos sobre objetos de la colección. */
  save() {
    persist();
  }
}
