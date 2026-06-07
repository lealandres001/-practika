import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { Product } from '../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  // ---- Categorías ----
  listCategories(): Promise<Category[]> {
    return this.categories.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  // ---- Productos (lectura pública) ----
  listProducts(categoryId?: string): Promise<Product[]> {
    return this.products.find({
      where: {
        isActive: true,
        available: true,
        ...(categoryId ? { categoryId } : {}),
      },
      order: { name: 'ASC' },
    });
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.products.findOne({ where: { id } });
    if (!product || !product.isActive) {
      throw new NotFoundException('Producto no encontrado.');
    }
    return product;
  }

  // ---- Productos (gestión admin) ----
  async createProduct(dto: CreateProductDto): Promise<Product> {
    // Validamos que la categoría exista para no crear productos huérfanos.
    const category = await this.categories.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('La categoría indicada no existe.');
    }
    const product = this.products.create(dto);
    return this.products.save(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getProduct(id);
    if (dto.categoryId) {
      const category = await this.categories.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('La categoría indicada no existe.');
      }
    }
    Object.assign(product, dto);
    return this.products.save(product);
  }

  /** Borrado lógico: nunca se elimina físicamente para no romper históricos. */
  async deactivateProduct(id: string): Promise<{ deactivated: boolean }> {
    const product = await this.getProduct(id);
    product.isActive = false;
    product.available = false;
    await this.products.save(product);
    return { deactivated: true };
  }
}
