import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario';
import { obterMensagemErro } from '../../utils/error.util';

type FiltroStatus = 'TODOS' | 'ATIVO' | 'INATIVO';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);

  readonly usuarios = signal<Usuario[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly editandoId = signal<number | null>(null);
  readonly busca = signal('');
  readonly filtro = signal<FiltroStatus>('TODOS');
  readonly drawerAberto = signal(false);
  readonly pagina = signal(1);
  readonly itensPorPagina = 8;

  readonly form = this.fb.group({
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    nome: ['', Validators.required],
    matricula: [''],
    setor: [''],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.required]],
    tipoUsuario: ['ROLE_USUARIO', Validators.required],
    senha: [''],
  });

  readonly totalAtivos = computed(
    () => this.usuarios().filter((u) => u.statusUsuario === 'ATIVO').length,
  );
  readonly totalInativos = computed(
    () => this.usuarios().filter((u) => u.statusUsuario === 'INATIVO').length,
  );

  readonly usuariosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const filtro = this.filtro();

    return this.usuarios().filter((usuario) => {
      const combinaTermo =
        !termo ||
        usuario.nome?.toLowerCase().includes(termo) ||
        usuario.cpf?.toLowerCase().includes(termo) ||
        usuario.matricula?.toLowerCase().includes(termo) ||
        usuario.setor?.toLowerCase().includes(termo) ||
        usuario.email?.toLowerCase().includes(termo) ||
        usuario.telefone?.toLowerCase().includes(termo);

      const combinaFiltro = filtro === 'TODOS' || usuario.statusUsuario === filtro;

      return Boolean(combinaTermo && combinaFiltro);
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.usuariosFiltrados().length / this.itensPorPagina)),
  );

  readonly usuariosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.itensPorPagina;
    return this.usuariosFiltrados().slice(inicio, inicio + this.itensPorPagina);
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

  definirFiltro(filtro: FiltroStatus): void {
    this.filtro.set(filtro);
    this.pagina.set(1);
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
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Falha ao carregar usuários.'));
        this.carregando.set(false);
      },
    });
  }

  abrirNovo(): void {
    this.editandoId.set(null);
    this.form.controls.cpf.enable();
    this.form.reset({
      cpf: '',
      nome: '',
      matricula: '',
      setor: '',
      email: '',
      telefone: '',
      tipoUsuario: 'ROLE_USUARIO',
      senha: '',
    });
    this.sucesso.set(null);
    this.erro.set(null);
    this.drawerAberto.set(true);
  }

  editar(usuario: Usuario): void {
    this.editandoId.set(usuario.id);
    this.form.setValue({
      cpf: usuario.cpf,
      nome: usuario.nome,
      matricula: usuario.matricula || '',
      setor: usuario.setor || '',
      email: usuario.email,
      telefone: usuario.telefone,
      tipoUsuario: usuario.tipoUsuario || 'ROLE_USUARIO',
      senha: '',
    });
    this.form.controls.cpf.disable();
    this.sucesso.set(null);
    this.erro.set(null);
    this.drawerAberto.set(true);
  }

  fecharDrawer(): void {
    this.drawerAberto.set(false);
    this.editandoId.set(null);
    this.form.controls.cpf.enable();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const payload: any = {
      cpf: val.cpf,
      nome: val.nome,
      matricula: val.matricula?.trim() ? val.matricula.trim() : undefined,
      setor: val.setor?.trim() ? val.setor.trim() : undefined,
      email: val.email,
      telefone: val.telefone,
      tipoUsuario: val.tipoUsuario || 'ROLE_USUARIO',
    };

    if (val.senha?.trim()) {
      payload.senha = val.senha.trim();
    }

    const id = this.editandoId();
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    const request$ = id
      ? this.usuarioService.atualizar(id, payload)
      : this.usuarioService.cadastrar(payload);

    request$.subscribe({
      next: () => {
        this.sucesso.set(id ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.');
        this.salvando.set(false);
        this.fecharDrawer();
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível salvar o usuário.'));
        this.salvando.set(false);
      },
    });
  }

  toggleStatus(usuario: Usuario): void {
    const acao = usuario.statusUsuario === 'ATIVO' ? 'desativar' : 'ativar';
    const request$ = acao === 'desativar'
      ? this.usuarioService.desativar(usuario.id)
      : this.usuarioService.ativar(usuario.id);

    request$.subscribe({
      next: () => {
        const msg = acao === 'desativar' ? 'Usuário desativado.' : 'Usuário ativado.';
        this.sucesso.set(msg);
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, `Não foi possível ${acao} o usuário.`));
      },
    });
  }
}
