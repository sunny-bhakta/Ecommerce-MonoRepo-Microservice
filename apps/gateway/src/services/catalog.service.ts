import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { GatewayHttpService } from './gateway-http.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateProductStatusDto } from '../dto/update-product-status.dto';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { CatalogCategory, CatalogProduct, CatalogVariant } from '../interfaces';
import { DownstreamApps } from '@app/common/enums/downstream-apps.enum';



@Injectable()
export class CatalogGatewayService {
  private readonly logger = new Logger(CatalogGatewayService.name);

  constructor(private readonly httpGateway: GatewayHttpService) { }

  createCategory(dto: CreateCategoryDto) {
    return this.httpGateway.post<CatalogCategory>(
      this.catalogUrl('/categories'),
      dto,
      'catalog service',
    );
  }

  listCategories() {
    return this.httpGateway.get<CatalogCategory[]>(
      this.catalogUrl('/categories'),
      'catalog service',
    );
  }

  async createProduct(dto: CreateProductDto, user: AuthenticatedUser) {
    const isAdmin = user.roles?.includes('admin');
    const isVendor = user.roles?.includes('vendor');
    const payload: CreateProductDto = { ...dto };

    if (isVendor && !isAdmin) {
      payload.vendorId = user.id;
      payload.status = 'pending';
    } else if (!payload.status) {
      payload.status = 'approved';
    }

    return this.httpGateway.post<CatalogProduct>(
      this.catalogUrl('/products'),
      payload,
      'catalog service',
    );
  }

  listProducts(vendorId?: string, status?: 'pending' | 'approved' | 'rejected') {
    const params = new URLSearchParams();
    const forceApprovedOnly = !vendorId;

    if (vendorId) params.append('vendorId', vendorId);
    if (status) {
      params.append('status', status);
    } else if (forceApprovedOnly) {
      params.append('status', 'approved');
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.httpGateway.get<CatalogProduct[]>(
      this.catalogUrl(`/products${query}`),
      'catalog service',
    );
  }

  getProduct(productId: string) {
    return this.httpGateway.get<CatalogProduct>(
      this.catalogUrl(`/products/${productId}`),
      'catalog service',
    );
  }

  async addVariant(productId: string, dto: CreateVariantDto, user: AuthenticatedUser) {
    await this.ensureVendorCanMutate(productId, user, true);

    return this.httpGateway.post<CatalogVariant>(
      this.catalogUrl(`/products/${productId}/variants`),
      dto,
      'catalog service',
    );
  }

  async updateProduct(productId: string, dto: UpdateProductDto, user: AuthenticatedUser) {
    await this.ensureVendorCanMutate(productId, user, false);

    return this.httpGateway.patch<CatalogProduct>(
      this.catalogUrl(`/products/${productId}`),
      dto,
      'catalog service',
    );
  }

  listVariants(productId: string) {
    return this.httpGateway.get<CatalogVariant[]>(
      this.catalogUrl(`/products/${productId}/variants`),
      'catalog service',
    );
  }

  updateProductStatus(productId: string, dto: UpdateProductStatusDto) {
    return this.httpGateway.patch<CatalogProduct>(
      this.catalogUrl(`/products/${productId}/status`),
      dto,
      'catalog service',
    );
  }

  private catalogUrl(pathname: string) {
    return this.httpGateway.composeServiceUrl(DownstreamApps.CATALOG, pathname);
  }

  private async ensureVendorCanMutate(productId: string, user: AuthenticatedUser, requireApproved: boolean) {
    const isAdmin = user.roles?.includes('admin');
    const isVendor = user.roles?.includes('vendor');

    if (!isVendor || isAdmin) {
      return;
    }

    const product = await this.getProduct(productId);
    if (product.vendorId && product.vendorId !== user.id) {
      throw new BadGatewayException('Cannot modify another vendor product');
    }
    if (requireApproved && product.status && product.status !== 'approved') {
      throw new BadGatewayException('Product is not approved; cannot add variants yet');
    }
  }
}