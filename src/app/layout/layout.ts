import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class LayoutComponent {
  readonly auth = inject(AuthService);

  readonly links = [
    { path: '/', label: 'Início', exact: true, icon: 'home', adminOnly: false },
    { path: '/livros', label: 'Acervo', exact: false, icon: 'book', adminOnly: false },
    { path: '/usuarios', label: 'Usuários', exact: false, icon: 'users', adminOnly: true },
    { path: '/emprestimos', label: 'Empréstimos', exact: false, icon: 'swap', adminOnly: true },
    { path: '/reservas', label: 'Reservas', exact: false, icon: 'calendar', adminOnly: false },
    { path: '/relatorios', label: 'Relatórios', exact: false, icon: 'chart', adminOnly: true },
  ];
}
