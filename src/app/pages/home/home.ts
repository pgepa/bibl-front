import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LivroService } from '../../services/livro.service';
import { UsuarioService } from '../../services/usuario.service';
import { EmprestimoService } from '../../services/emprestimo.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private readonly livroService = inject(LivroService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly emprestimoService = inject(EmprestimoService);

  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly totalLivros = signal(0);
  readonly livrosDisponiveis = signal(0);
  readonly totalUsuarios = signal(0);
  readonly emprestimosAtivos = signal(0);

  readonly atalhos = [
    {
      path: '/livros',
      titulo: 'Cadastrar livro',
      texto: 'Inclua títulos novos no acervo.',
    },
    {
      path: '/usuarios',
      titulo: 'Cadastrar usuário',
      texto: 'Registre leitores autorizados.',
    },
    {
      path: '/emprestimos',
      titulo: 'Novo empréstimo',
      texto: 'Associe um livro disponível a um usuário.',
    },
  ];

  readonly resumo = computed(() => [
    { label: 'Livros no acervo', value: this.totalLivros() },
    { label: 'Disponíveis', value: this.livrosDisponiveis() },
    { label: 'Usuários', value: this.totalUsuarios() },
    { label: 'Empréstimos ativos', value: this.emprestimosAtivos() },
  ]);

  ngOnInit(): void {
    forkJoin({
      livros: this.livroService.listar(),
      usuarios: this.usuarioService.listar(),
      emprestimos: this.emprestimoService.listar(),
    }).subscribe({
      next: ({ livros, usuarios, emprestimos }) => {
        this.totalLivros.set(livros.length);
        this.livrosDisponiveis.set(livros.filter((l) => l.disponivel).length);
        this.totalUsuarios.set(usuarios.length);
        this.emprestimosAtivos.set(
          emprestimos.filter((e) => e.statusEmprestimo === 'ATIVO').length,
        );
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o resumo. Verifique se a API está em execução.');
        this.carregando.set(false);
      },
    });
  }
}
