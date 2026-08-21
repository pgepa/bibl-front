import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { HomeComponent } from './pages/home/home';
import { LivrosComponent } from './pages/livros/livros';
import { UsuariosComponent } from './pages/usuarios/usuarios';
import { EmprestimosComponent } from './pages/emprestimos/emprestimos';
import { ReservasComponent } from './pages/reservas/reservas';
import { RelatoriosComponent } from './pages/relatorios/relatorios';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'livros', component: LivrosComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'emprestimos', component: EmprestimosComponent },
      { path: 'reservas', component: ReservasComponent },
      { path: 'relatorios', component: RelatoriosComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
