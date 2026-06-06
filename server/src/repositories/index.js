/* ============================================================
   PRACTIKA API · repositories/index.js
   Instancias de repositorio por colección.
   ============================================================ */
import { BaseRepository } from "./base.repository.js";

export const categoryRepo = new BaseRepository("categories");
export const productRepo  = new BaseRepository("products");
export const planRepo     = new BaseRepository("plans");
export const zoneRepo     = new BaseRepository("zones");
export const operatorRepo = new BaseRepository("operators");
export const orderRepo    = new BaseRepository("orders");
export const courseRepo   = new BaseRepository("courses");
export const historyRepo  = new BaseRepository("salesHistory");
