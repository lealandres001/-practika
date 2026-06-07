import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  // ---- Lectura pública (la usa la app cliente) ----
  @Public()
  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Public()
  @Get('products')
  listProducts(@Query('categoryId') categoryId?: string) {
    return this.catalog.listProducts(categoryId);
  }

  @Public()
  @Get('products/:id')
  getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getProduct(id);
  }

  // ---- Gestión protegida (solo admin) ----
  @Post('products')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Patch('products/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalog.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  deactivateProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deactivateProduct(id);
  }
}
