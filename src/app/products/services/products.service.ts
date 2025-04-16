import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '@auth/interfaces/user.interface';
import {
  Gender,
  Product,
  ProductResponse,

} from '@products/interfaces/product.interface';
import { forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  gender?: string;
}

const emptyProduct: Product = {
  id: 'new',
  title: '',
  price: 0,
  description: '',
  slug: '',
  stock: 0,
  sizes: [],
  gender: Gender.Men,
  tags: [],
  images: [],
  user: {} as User
}

@Injectable({ providedIn: 'root' })
export class ProductsService {

  private http = inject(HttpClient);

  private productsCache = new Map<string, ProductResponse> ();
  private productCache = new Map<string, Product>();

  getProducts(options: Options): Observable<ProductResponse> {

    const { limit = 9, offset = 0, gender = '' } = options;

    const key = `${limit}-${offset}-${gender}`; // 9-0-''
    if (this.productsCache.has(key)) {
      return of(this.productsCache.get(key)!);
    }

    return this.http
      .get<ProductResponse>(`${baseUrl}/products`, {
        params: {
          limit,
          offset,
          gender,
        },
      })
      .pipe(
        tap((resp) => this.productsCache.set(key, resp)),
      );
  }

  getProductByIdSlug(idSlug: string): Observable<Product> {
    if (this.productCache.has(idSlug)) {
      return of(this.productCache.get(idSlug)!);
    }

    return this.http.get<Product>(`${baseUrl}/products/${idSlug}`).pipe(
      tap((product) => this.productCache.set(idSlug, product)),
    );
  }


  getProductById(id: string ): Observable<Product> {

    if (id === 'new') {
      return of(emptyProduct);
    }

    if (this.productCache.has(id)) {
      return of(this.productCache.get(id)!);
    }

    return this.http.get<Product>(`${baseUrl}/products/${id}`).pipe(
      tap((product) => this.productCache.set(id, product)),
    );
  }

  updateProduct(id: string, productLike: Partial<Product>, imageFileList?: FileList): Observable<Product> {
    const currentImages = productLike.images || [];
    return this.uploadImages(imageFileList!)
    .pipe(
      map((imageNames) => ({
        ...productLike,
        images: [...currentImages, ...imageNames],
      })),
      switchMap((updateProduct) => this.http.patch<Product>(`${baseUrl}/products/${ id }`, updateProduct)),
      tap((product) => this.updateProductCache(product))
    );

    // return this.http.patch<Product>(`${baseUrl}/products/${ id }`, productLike)
  }


  updateProductCache( product: Product) {
    const productId = product.id;
    this.productCache.set(productId, product);

    this.productsCache.forEach( productResponse => {
      productResponse.products = productResponse.products.map(
        (currentProduct) => currentProduct.id === productId ? product : currentProduct )
    } )
    console.log("Cache Actualizado");
  }


  createProduct(productLike: Partial<Product>, imageFileList?: FileList): Observable<Product> {
    const currentImages = productLike.images || [];

    return this.uploadImages(imageFileList!).pipe(
      map((imageNames) => ({
        ...productLike,
        images: [...currentImages, ...imageNames],
      })),
    ).pipe(
      switchMap((product) => this.http.post<Product>(`${baseUrl}/products`, product)),
      tap((product) => this.updateProductCache(product)),
    )
    // return this.http.post<Product>(`${baseUrl}/products`, productLike)
    // .pipe(tap((product) => this.updateProductCache(product)));
  }

  // Tome un fileList y los subimos - Cargue de imagenes
  uploadImages( images: FileList): Observable<string[]> {
    if(!images) return of([]);

    const uploadObservables = Array.from(images).map((imageFile) => this.uploadImage(imageFile));

    return forkJoin(uploadObservables).pipe(
      tap((imageNames) => imageNames),
    );
  }
   // Tome un fileList y los subimos - Cargue de imagen
  uploadImage( imageFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', imageFile);
    return this.http.post<{fileName: string}>(`${baseUrl}/files/product`, formData)
    .pipe(map((resp) => resp.fileName),
    );
  }
}
