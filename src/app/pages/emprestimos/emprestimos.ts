import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { EmprestimoService } from '../../services/emprestimo.service';
import { LivroService } from '../../services/livro.service';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { Emprestimo } from '../../models/emprestimo';
import { Livro } from '../../models/livro';
import { Usuario } from '../../models/usuario';
import { obterMensagemErro } from '../../utils/error.util';

type FiltroStatus = 'TODOS' | 'ATIVO' | 'ATRASADO' | 'CONCLUIDO';

@Component({
  selector: 'app-emprestimos',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './emprestimos.html',
  styleUrl: './emprestimos.css',
})
export class EmprestimosComponent implements OnInit {
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly livroService = inject(LivroService);
  private readonly usuarioService = inject(UsuarioService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly emprestimos = signal<Emprestimo[]>([]);
  readonly livrosDisponiveis = signal<Livro[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly devolvendoId = signal<number | null>(null);
  readonly renovandoId = signal<number | null>(null);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly filtroStatus = signal<FiltroStatus>('TODOS');
  readonly busca = signal('');
  readonly drawerAberto = signal(false);
  readonly pagina = signal(1);
  readonly itensPorPagina = 8;

  readonly buscaLivro = signal('');
  readonly buscaUsuario = signal('');
  readonly listaLivrosAberta = signal(false);
  readonly listaUsuariosAberta = signal(false);

  private prazoPadrao(): string {
    const data = new Date();
    data.setDate(data.getDate() + 14);
    return data.toISOString().slice(0, 10);
  }

  private dataNaoPassadaValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    return control.value < this.hoje ? { dataPassada: true } : null;
  }

  readonly hoje = new Date().toISOString().slice(0, 10);

  readonly form = this.fb.group({
    livroId: [0, [Validators.required, Validators.min(1)]],
    usuarioId: [0, [Validators.required, Validators.min(1)]],
    dataPrevistaDevolucao: [this.prazoPadrao(), [Validators.required, this.dataNaoPassadaValidator.bind(this)]],
    nomeFuncionario: [''],
  });

  readonly totalAtivos = computed(
    () => this.emprestimos().filter((e) => e.statusEmprestimo === 'ATIVO').length,
  );
  readonly totalAtrasados = computed(
    () => this.emprestimos().filter((e) => e.statusEmprestimo === 'ATRASADO').length,
  );
  readonly totalConcluidos = computed(
    () => this.emprestimos().filter((e) => e.statusEmprestimo === 'CONCLUIDO').length,
  );

  readonly emprestimosFiltrados = computed(() => {
    const filtro = this.filtroStatus();
    const termo = this.busca().trim().toLowerCase();

    return this.emprestimos().filter((item) => {
      const combinaFiltro = filtro === 'TODOS' || item.statusEmprestimo === filtro;
      const combinaTermo =
        !termo ||
        item.livro?.titulo?.toLowerCase().includes(termo) ||
        item.livro?.registro?.toLowerCase().includes(termo) ||
        item.usuario?.nome?.toLowerCase().includes(termo) ||
        item.usuario?.matricula?.toLowerCase().includes(termo) ||
        item.nomeFuncionario?.toLowerCase().includes(termo) ||
        item.idTransacao?.toLowerCase().includes(termo);
      return Boolean(combinaFiltro && combinaTermo);
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.emprestimosFiltrados().length / this.itensPorPagina)),
  );

  readonly emprestimosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.itensPorPagina;
    return this.emprestimosFiltrados().slice(inicio, inicio + this.itensPorPagina);
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

  readonly livrosFiltrados = computed(() => {
    const termo = this.buscaLivro().trim().toLowerCase();
    const lista = this.livrosDisponiveis();
    if (!termo) {
      return lista;
    }
    return lista.filter(
      (livro) =>
        livro.titulo?.toLowerCase().includes(termo) ||
        livro.autor?.toLowerCase().includes(termo) ||
        livro.registro?.toLowerCase().includes(termo) ||
        livro.isbn?.toLowerCase().includes(termo),
    );
  });

  readonly usuariosFiltrados = computed(() => {
    const termo = this.buscaUsuario().trim().toLowerCase();
    const lista = this.usuarios().filter((u) => u.statusUsuario === 'ATIVO');
    if (!termo) {
      return lista;
    }
    return lista.filter(
      (usuario) =>
        usuario.nome?.toLowerCase().includes(termo) ||
        usuario.cpf?.toLowerCase().includes(termo) ||
        usuario.matricula?.toLowerCase().includes(termo) ||
        usuario.setor?.toLowerCase().includes(termo) ||
        usuario.email?.toLowerCase().includes(termo),
    );
  });

  ngOnInit(): void {
    this.carregar();
  }

  definirFiltro(filtro: FiltroStatus): void {
    this.filtroStatus.set(filtro);
    this.pagina.set(1);
  }

  onBuscaChange(valor: string): void {
    this.busca.set(valor);
    this.pagina.set(1);
  }

  irParaPagina(pagina: number): void {
    this.pagina.set(pagina);
  }

  onBuscaLivroChange(valor: string): void {
    this.buscaLivro.set(valor);
    this.listaLivrosAberta.set(true);
    if (this.form.controls.livroId.value !== 0) {
      this.form.controls.livroId.setValue(0);
    }
  }

  onBuscaUsuarioChange(valor: string): void {
    this.buscaUsuario.set(valor);
    this.listaUsuariosAberta.set(true);
    if (this.form.controls.usuarioId.value !== 0) {
      this.form.controls.usuarioId.setValue(0);
    }
  }

  selecionarLivro(livro: Livro): void {
    this.form.controls.livroId.setValue(livro.id);
    const reg = livro.registro ? `[${livro.registro}] ` : '';
    this.buscaLivro.set(`${reg}${livro.titulo} — ${livro.autor}`);
    this.listaLivrosAberta.set(false);
  }

  selecionarUsuario(usuario: Usuario): void {
    this.form.controls.usuarioId.setValue(usuario.id);
    const mat = usuario.matricula ? ` (Mat: ${usuario.matricula})` : '';
    this.buscaUsuario.set(`${usuario.nome}${mat}`);
    this.listaUsuariosAberta.set(false);
  }

  fecharListaLivros(): void {
    setTimeout(() => this.listaLivrosAberta.set(false), 150);
  }

  fecharListaUsuarios(): void {
    setTimeout(() => this.listaUsuariosAberta.set(false), 150);
  }

  carregar(): void {
    this.carregando.set(true);
    forkJoin({
      emprestimos: this.emprestimoService.listar(),
      livros: this.livroService.listar(),
      usuarios: this.usuarioService.listar(),
    }).subscribe({
      next: ({ emprestimos, livros, usuarios }) => {
        this.emprestimos.set(emprestimos);
        this.livrosDisponiveis.set(livros.filter((livro) => livro.disponivel));
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Falha ao carregar empréstimos.'));
        this.carregando.set(false);
      },
    });
  }

  abrirNovo(): void {
    const atendenteAtual = this.auth.currentUser()?.nome || 'Atendente da Biblioteca';
    this.form.reset({
      livroId: 0,
      usuarioId: 0,
      dataPrevistaDevolucao: this.prazoPadrao(),
      nomeFuncionario: atendenteAtual,
    });
    this.buscaLivro.set('');
    this.buscaUsuario.set('');
    this.sucesso.set(null);
    this.erro.set(null);
    this.drawerAberto.set(true);
  }

  fecharDrawer(): void {
    this.drawerAberto.set(false);
  }

  realizar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const payload = {
      livroId: Number(val.livroId),
      usuarioId: Number(val.usuarioId),
      dataPrevistaDevolucao: val.dataPrevistaDevolucao!,
      nomeFuncionario: val.nomeFuncionario?.trim() || this.auth.currentUser()?.nome || undefined,
    };

    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    this.emprestimoService.realizar(payload).subscribe({
      next: () => {
        this.sucesso.set('Empréstimo registrado com sucesso.');
        this.salvando.set(false);
        this.fecharDrawer();
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível registrar o empréstimo.'));
        this.salvando.set(false);
      },
    });
  }

  devolver(emprestimo: Emprestimo): void {
    if (!confirm(`Confirmar devolução da obra "${emprestimo.livro.titulo}"?`)) {
      return;
    }

    this.devolvendoId.set(emprestimo.id);
    this.erro.set(null);
    this.sucesso.set(null);

    this.emprestimoService.devolver(emprestimo.id).subscribe({
      next: () => {
        this.sucesso.set('Devolução registrada com sucesso.');
        this.devolvendoId.set(null);
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível registrar a devolução.'));
        this.devolvendoId.set(null);
      },
    });
  }

  renovar(emprestimo: Emprestimo): void {
    this.renovandoId.set(emprestimo.id);
    this.erro.set(null);
    this.sucesso.set(null);

    this.emprestimoService.renovar(emprestimo.id).subscribe({
      next: () => {
        this.sucesso.set('Empréstimo renovado com sucesso.');
        this.renovandoId.set(null);
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível renovar o empréstimo.'));
        this.renovandoId.set(null);
      },
    });
  }
}
