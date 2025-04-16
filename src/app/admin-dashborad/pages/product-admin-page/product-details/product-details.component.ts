import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductCarouselComponent } from '@products/components/product-carousel/product-carousel.component';
import { Product } from '@products/interfaces/product.interface';
import { FormUtils } from '@utils/form.utils';
import { FormErrorLabelComponent } from "../../../../shared/components/form-error-label/form-error-label.component";
import { ProductsService } from '@products/services/products.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'product-details',
  imports: [ProductCarouselComponent, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  // Tengo un producto con este signal
  product = input.required<Product>();

  // Formularios reactivo
  fb = inject(FormBuilder);
  router = inject(Router);

  productService = inject(ProductsService);
  wasSaved = signal(false);

  imageFileList: FileList | undefined = undefined;
  tempImages = signal<string[]>([]);

  // Señal computada para el carrousel
  imagesToCarrousel = computed(() => {
    const currentProductImages = [...this.product().images, ...this.tempImages()];
    return currentProductImages;
  })

  // Formulario reactivo
  productForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(FormUtils.slugPattern)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sizes: [['']],
    images: [[]],
    tags: [''],
    gender: ['men', [
      Validators.required, Validators.pattern(/men|women|kid|unisex/)]
    ],
  });

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  ngOnInit(): void {
    this.setFormValue(this.product());
  }

  // Transformacion de array a string
  setFormValue(formLike: Partial<Product>) {
    // Patchvalue es similar al reset
    this.productForm.reset(this.product() as any);
    // this.productForm.patchValue(formLike as any);
    this.productForm.patchValue({ tags: formLike.tags?.join(',') });
  }

  onSizeCliecked(size: string) {
    const currentSizes = this.productForm.value.sizes ?? [];

    if (currentSizes.includes(size)) {
      currentSizes.splice(currentSizes.indexOf(size), 1);
    } else {
      currentSizes.push(size);
    }
    this.productForm.patchValue({ sizes: currentSizes })
  }


  async onSubmit() {
    const isValid = this.productForm.valid;
    this.productForm.markAllAsTouched();

    if (!isValid) return;
    const formValue = this.productForm.value;
    const productLike: Partial<Product> = {
      ...(formValue as any),
      tags: formValue.tags?.toLowerCase().split(',').map(tag => tag.trim()) ?? [],
    };

    if (this.product().id === 'new') {
      //creamos el producto
      const product = await firstValueFrom(
        this.productService.createProduct(productLike, this.imageFileList )
      );
      this.productService.createProduct(productLike).subscribe(
        product => {
          console.log("Producto Creado")
          this.router.navigate(['/admin/products', product.id]);
        }
      )

    } else {
      // Actualizamos el producto
      await firstValueFrom(
        this.productService.updateProduct(this.product().id, productLike, this.imageFileList)
      )
    }
    this.wasSaved.set(true);
    setTimeout(() => {
      this.wasSaved.set(false);
    }, 3000);
  }

  // Manejo de imagenes
  onFilesChanged(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;
    this.imageFileList = fileList ?? undefined;
    // Si no hay archivos, salimos
    if (!fileList) return;
    const imageUrls = Array.from(fileList ?? []).map(file => URL.createObjectURL(file));

    this.tempImages.set(imageUrls);
  }
}
