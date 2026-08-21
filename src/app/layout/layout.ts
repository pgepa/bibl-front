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
    { path: '/', label: 'Início', exact: true, icon: 'home' },
    { path: '/livros', label: 'Livros', exact: false, icon: 'book' },
    { path: '/usuarios', label: 'Usuários', exact: false, icon: 'users' },
    { path: '/emprestimos', label: 'Empréstimos', exact: false, icon: 'swap' },
    { path: '/reservas', label: 'Reservas', exact: false, icon: 'calendar' },
    { path: '/relatorios', label: 'Relatórios', exact: false, icon: 'chart' },
  ];
}
