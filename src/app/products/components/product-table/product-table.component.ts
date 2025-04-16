
import { Component, inject, input } from '@angular/core';
import { Product } from '@products/interfaces/product.interface';
import { ProductImagePipe } from "../../pipes/product-image.pipe";
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductsService } from '@products/services/products.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from "../../../shared/components/pagination/pagination.component";

@Component({
  selector: 'product-table',
  imports: [ProductImagePipe, RouterLink, CurrencyPipe],
  templateUrl: './product-table.component.html',
})
export class ProductTableComponent {

  products = input.required <Product[]>();
  productsService = inject(ProductsService);
  paginationService = inject(PaginationService);

  productsResource = rxResource({
      request: () => ({ page: this.paginationService.currentPage() - 1}),
      loader: ({ request }) => {

        return this.productsService.getProducts({
          offset: request.page * 9,
        });
      },
    });


}
