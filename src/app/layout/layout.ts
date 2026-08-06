import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class LayoutComponent {
  readonly links = [
    { path: '/', label: 'Início', exact: true },
    { path: '/livros', label: 'Livros', exact: false },
    { path: '/usuarios', label: 'Usuários', exact: false },
    { path: '/emprestimos', label: 'Empréstimos', exact: false },
  ];
}
