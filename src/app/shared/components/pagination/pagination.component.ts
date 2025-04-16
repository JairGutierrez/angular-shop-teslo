import { Component, input, computed, signal, linkedSignal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {

  pages = input(0);
  currentPage = input(1);

  activePage = linkedSignal(this.currentPage);

  getPages = computed(() => {
    return Array.from({ length: this.pages() }, (_, i) => i + 1);
  } );

}
