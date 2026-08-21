import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LivroService } from '../../services/livro.service';
import { Livro } from '../../models/livro';
import { obterMensagemErro } from '../../utils/error.util';

type FiltroDisponibilidade = 'TODOS' | 'DISPONIVEL' | 'EMPRESTADO';

@Component({
  selector: 'app-livros',
  imports: [ReactiveFormsModule],
  templateUrl: './livros.html',
  styleUrl: './livros.css',
})
export class LivrosComponent implements OnInit {
  private readonly livroService = inject(LivroService);
  private readonly fb = inject(FormBuilder);

  readonly livros = signal<Livro[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly editandoId = signal<number | null>(null);
  readonly busca = signal('');
  readonly filtro = signal<FiltroDisponibilidade>('TODOS');
  readonly drawerAberto = signal(false);
  
  readonly colunasVisiveis = signal({
    autor: true,
    anoLancamento: true,
    status: true,
    isbn: true
  });
  readonly pagina = signal(1);
  readonly itensPorPagina = 8;
  readonly anoAtual = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    autor: ['', Validators.required],
    isbn: ['', Validators.required],
    anoLancamento: [
      this.anoAtual,
      [Validators.required, Validators.min(1), Validators.max(this.anoAtual)],
    ],
  });

  readonly totalDisponiveis = computed(
    () => this.livros().filter((l) => l.disponivel).length,
  );
  readonly totalEmprestados = computed(
    () => this.livros().filter((l) => !l.disponivel).length,
  );

  readonly livrosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const filtro = this.filtro();

    return this.livros().filter((livro) => {
      const combinaTermo =
        !termo ||
        livro.titulo.toLowerCase().includes(termo) ||
        livro.autor.toLowerCase().includes(termo) ||
        livro.isbn.toLowerCase().includes(termo);

      const combinaFiltro =
        filtro === 'TODOS' ||
        (filtro === 'DISPONIVEL' && livro.disponivel) ||
        (filtro === 'EMPRESTADO' && !livro.disponivel);

      return combinaTermo && combinaFiltro;
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.livrosFiltrados().length / this.itensPorPagina)),
  );

  readonly livrosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.itensPorPagina;
    return this.livrosFiltrados().slice(inicio, inicio + this.itensPorPagina);
  });

  readonly paginasVisiveis = computed(() => {
    const total = this.totalPaginas();
    const atual = this.pagina();
    const janela = 2;
    const inicio = Math.max(1, atual - janela);
    const fim = Math.min(total, atual + janela);
    const paginas: number[] = [];
    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }
    return paginas;
  });

  ngOnInit(): void {
    this.carregar();
  }

  definirFiltro(filtro: FiltroDisponibilidade): void {
    this.filtro.set(filtro);
    this.pagina.set(1);
  }

  toggleColuna(coluna: 'autor' | 'anoLancamento' | 'status' | 'isbn'): void {
    this.colunasVisiveis.update((c) => ({ ...c, [coluna]: !c[coluna] }));
  }

  onBuscaChange(valor: string): void {
    this.busca.set(valor);
    this.pagina.set(1);
  }

  irParaPagina(pagina: number): void {
    this.pagina.set(pagina);
  }

  carregar(): void {
    this.carregando.set(true);
    this.livroService.listar().subscribe({
      next: (livros) => {
        this.livros.set(livros);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Falha ao carregar livros.'));
        this.carregando.set(false);
      },
    });
  }

  abrirNovo(): void {
    this.editandoId.set(null);
    this.form.reset({
      titulo: '',
      autor: '',
      isbn: '',
      anoLancamento: this.anoAtual,
    });
    this.sucesso.set(null);
    this.erro.set(null);
    this.drawerAberto.set(true);
  }

  editar(livro: Livro): void {
    this.editandoId.set(livro.id);
    this.form.setValue({
      titulo: livro.titulo,
      autor: livro.autor,
      isbn: livro.isbn,
      anoLancamento: livro.anoLancamento,
    });
    this.sucesso.set(null);
    this.erro.set(null);
    this.drawerAberto.set(true);
  }

  fecharDrawer(): void {
    this.drawerAberto.set(false);
    this.editandoId.set(null);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const id = this.editandoId();
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    const request$ = id
      ? this.livroService.atualizar(id, payload)
      : this.livroService.cadastrar(payload);

    request$.subscribe({
      next: () => {
        this.sucesso.set(id ? 'Livro atualizado.' : 'Livro cadastrado.');
        this.salvando.set(false);
        this.fecharDrawer();
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível salvar o livro.'));
        this.salvando.set(false);
      },
    });
  }

  remover(livro: Livro): void {
    if (!confirm(`Remover o livro "${livro.titulo}"?`)) {
      return;
    }

    this.livroService.remover(livro.id).subscribe({
      next: () => {
        this.sucesso.set('Livro removido.');
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível remover o livro.'));
      },
    });
  }
}
