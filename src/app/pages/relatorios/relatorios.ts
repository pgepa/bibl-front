import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RelatorioService } from '../../services/relatorio.service';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { RelatorioEmprestimoResponse, FiltrosRelatorio } from '../../models/relatorio';
import { Usuario } from '../../models/usuario';
import { obterMensagemErro } from '../../utils/error.util';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

type PdfMakeDocument = {
  getBlob: () => Promise<Blob>;
};

type PdfMakeApi = {
  addVirtualFileSystem: (vfs: Record<string, string>) => void;
  createPdf: (docDefinition: Record<string, unknown>) => PdfMakeDocument;
};

@Component({
  selector: 'app-relatorios',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css'
})
export class RelatoriosComponent implements OnInit {
  private readonly relatorioService = inject(RelatorioService);
  private readonly usuarioService = inject(UsuarioService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly pdfMake = pdfMake as unknown as PdfMakeApi;
  private fontesPdfConfiguradas = false;

  readonly carregando = signal(true);
  readonly gerandoPdf = signal(false);
  readonly erro = signal<string | null>(null);
  readonly relatorio = signal<RelatorioEmprestimoResponse | null>(null);
  readonly usuarios = signal<Usuario[]>([]);
  readonly abaAtiva = signal<'resumo' | 'detalhes'>('resumo');

  readonly formFiltros = this.fb.group({
    usuarioId: [null as number | null],
    dataInicio: [''],
    dataFim: [''],
    status: ['']
  });

  ngOnInit(): void {
    this.configurarFontesPdf();
    this.carregarUsuarios();
    this.carregar();
  }

  carregarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (dados) => this.usuarios.set(dados),
      error: () => {}
    });
  }

  aplicarPeriodo(dias: number | 'mes' | 'todos'): void {
    const hoje = new Date();
    const dataFimStr = hoje.toISOString().slice(0, 10);

    if (dias === 'todos') {
      this.formFiltros.patchValue({ dataInicio: '', dataFim: '' });
    } else if (dias === 'mes') {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      this.formFiltros.patchValue({
        dataInicio: primeiroDia.toISOString().slice(0, 10),
        dataFim: dataFimStr
      });
    } else {
      const inicio = new Date();
      inicio.setDate(hoje.getDate() - dias);
      this.formFiltros.patchValue({
        dataInicio: inicio.toISOString().slice(0, 10),
        dataFim: dataFimStr
      });
    }

    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    const val = this.formFiltros.value;
    const filtros: FiltrosRelatorio = {
      usuarioId: val.usuarioId ? Number(val.usuarioId) : null,
      dataInicio: val.dataInicio || null,
      dataFim: val.dataFim || null,
      status: (val.status as any) || null
    };

    this.relatorioService.gerarRelatorio(filtros).subscribe({
      next: (relatorio) => {
        this.relatorio.set(relatorio);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(
          obterMensagemErro(err, 'Não foi possível carregar o relatório.')
        );
        this.carregando.set(false);
      }
    });
  }

  limparFiltros(): void {
    this.formFiltros.reset({
      usuarioId: null,
      dataInicio: '',
      dataFim: '',
      status: ''
    });
    this.carregar();
  }

  async exportarPDF(): Promise<void> {
    const dados = this.relatorio();

    if (!dados) {
      this.erro.set('Não existem dados disponíveis para gerar o relatório.');
      return;
    }

    this.erro.set(null);
    this.gerandoPdf.set(true);

    const novaGuia = window.open('about:blank', '_blank');

    if (!novaGuia) {
      this.gerandoPdf.set(false);
      this.erro.set(
        'O navegador bloqueou a abertura da nova guia. Permita pop-ups para este site e tente novamente.'
      );
      return;
    }

    this.mostrarCarregamentoNaGuia(novaGuia);

    try {
      const pdf = this.pdfMake.createPdf(
        this.montarDocumentoPdf(dados)
      );
      const blob = await this.obterBlobPdf(pdf);
      const pdfUrl = URL.createObjectURL(blob);

      novaGuia.document.title = 'Relatório Geral de Circulação - PGE-PA';
      novaGuia.location.href = pdfUrl;

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      novaGuia.close();
      this.erro.set('Ocorreu um erro ao gerar o PDF.');
    } finally {
      this.gerandoPdf.set(false);
    }
  }

  private configurarFontesPdf(): void {
    if (this.fontesPdfConfiguradas) {
      return;
    }

    this.pdfMake.addVirtualFileSystem(pdfFonts as Record<string, string>);
    this.fontesPdfConfiguradas = true;
  }

  private mostrarCarregamentoNaGuia(novaGuia: Window): void {
    novaGuia.document.title = 'Gerando relatório PGE-PA...';
    novaGuia.document.body.innerHTML = `
      <div style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f8f6; color: #0e4c34;">
        <div style="text-align: center; max-width: 360px; padding: 28px; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <h2 style="margin: 0 0 10px; color: #0e4c34;">Gerando Relatório...</h2>
          <p style="margin: 0; color: #555; line-height: 1.5; font-size: 14px;">Preparando dados estatísticos e histórico de circulação da Biblioteca PGE-PA.</p>
        </div>
      </div>
    `;
  }

  private montarDocumentoPdf(dados: RelatorioEmprestimoResponse): Record<string, unknown> {
    const agora = new Date();
    const dataEmissao = agora.toLocaleDateString('pt-BR');
    const horaEmissao = agora.toLocaleTimeString('pt-BR');
    const operador = this.auth.currentUser()?.nome || 'Operador do Sistema';

    // Resumo de filtros aplicados
    const filtroPeriodo = (dados.dataInicio || dados.dataFim)
      ? `${this.formatarDataPdf(dados.dataInicio) || 'Início'} até ${this.formatarDataPdf(dados.dataFim) || 'Atual'}`
      : 'Todo o histórico';

    const filtroUsuario = dados.usuarioNomeFiltro ? dados.usuarioNomeFiltro : 'Todos os leitores';

    return {
      pageOrientation: 'landscape',
      pageSize: 'A4',
      pageMargins: [35, 45, 35, 45],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: 'Biblioteca PGE-PA • Procuradoria Geral do Estado do Pará', alignment: 'left', style: 'footerText' },
          { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', style: 'footerText' }
        ],
        margin: [35, 10, 35, 0]
      }),
      content: [
        // Cabeçalho institucional
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'GOVERNO DO ESTADO DO PARÁ', style: 'institutionUpper' },
                { text: 'PROCURADORIA GERAL DO ESTADO — PGE-PA', style: 'institutionMain' },
                { text: 'Centro de Estudos • Biblioteca e Acervo Jurídico', style: 'institutionSub' }
              ]
            },
            {
              width: 'auto',
              alignment: 'right',
              stack: [
                { text: 'RELATÓRIO DE CIRCULAÇÃO', style: 'reportTitle' },
                { text: `Emissão: ${dataEmissao} às ${horaEmissao}`, style: 'metaDate' },
                { text: `Emitido por: ${operador}`, style: 'metaDate' }
              ]
            }
          ]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 772, y2: 8, lineWidth: 1.5, lineColor: '#0e4c34' }] },
        { text: '', margin: [0, 6, 0, 6] },

        // Caixa de Parâmetros / Filtros Aplicados
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: [{ text: 'Período: ', bold: true }, filtroPeriodo], style: 'paramCell' },
                { text: [{ text: 'Leitor / Servidor: ', bold: true }, filtroUsuario], style: 'paramCell' },
                { text: [{ text: 'Total de Registros: ', bold: true }, `${dados.emprestimosTotais} empréstimo(s)`], style: 'paramCell' }
              ]
            ]
          },
          layout: {
            fillColor: () => '#f3f7f5',
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#d8e5e0',
            vLineColor: () => '#d8e5e0'
          },
          margin: [0, 0, 0, 14]
        },

        // Métricas Estatísticas
        { text: 'QUADRO ESTATÍSTICO DE CIRCULAÇÃO', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', '*', '*', '*', '*', '*'],
            body: [
              [
                { text: 'Total Geral', style: 'metricHeader' },
                { text: 'Empréstimos Ativos', style: 'metricHeader' },
                { text: 'Devolvidos', style: 'metricHeader' },
                { text: 'Atrasados', style: 'metricHeader' },
                { text: 'Leitores Atendidos', style: 'metricHeader' },
                { text: 'Obras Distintas', style: 'metricHeader' }
              ],
              [
                { text: dados.emprestimosTotais.toString(), style: 'metricValue', color: '#0e4c34' },
                { text: dados.emprestimosAtivos.toString(), style: 'metricValue', color: '#167a54' },
                { text: dados.emprestimosConcluidos.toString(), style: 'metricValue', color: '#1f9d63' },
                { text: dados.emprestimosAtrasados.toString(), style: 'metricValue', color: '#b42318' },
                { text: dados.totalUsuariosAtendidos.toString(), style: 'metricValue', color: '#2563a8' },
                { text: dados.totalObrasDistintas.toString(), style: 'metricValue', color: '#5b21b6' }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 18]
        },

        // Tabela Detalhada de Empréstimos
        { text: 'DETALHAMENTO DOS EMPRÉSTIMOS', style: 'sectionHeader' },
        dados.itens.length > 0
          ? {
              table: {
                headerRows: 1,
                widths: [42, '*', '*', 58, 58, 58, 52, 60],
                body: [
                  [
                    { text: 'Cód.', style: 'tableHeader' },
                    { text: 'Obra / Tombo', style: 'tableHeader' },
                    { text: 'Leitor / Setor / Matrícula', style: 'tableHeader' },
                    { text: 'Saída', style: 'tableHeader' },
                    { text: 'Previsão', style: 'tableHeader' },
                    { text: 'Devolução', style: 'tableHeader' },
                    { text: 'Status', style: 'tableHeader' },
                    { text: 'Atendente', style: 'tableHeader' }
                  ],
                  ...dados.itens.map((item) => {
                    const livroDesc = item.livroRegistro ? `[${item.livroRegistro}] ${item.livroTitulo}` : item.livroTitulo;
                    const matDesc = item.usuarioMatricula ? ` (Mat: ${item.usuarioMatricula})` : '';
                    const setorDesc = item.usuarioSetor ? ` • ${item.usuarioSetor}` : '';
                    const leitorDesc = `${item.usuarioNome}${matDesc}${setorDesc}`;

                    let statusColor = '#1f9d63';
                    if (item.statusEmprestimo === 'ATRASADO') statusColor = '#b42318';
                    if (item.statusEmprestimo === 'ATIVO') statusColor = '#9a6700';

                    return [
                      { text: item.idTransacao || `#${item.id}`, fontSize: 7, font: 'Courier' },
                      { text: livroDesc, fontSize: 8 },
                      { text: leitorDesc, fontSize: 8 },
                      { text: this.formatarDataPdf(item.dataEmprestimo), fontSize: 8, alignment: 'center' },
                      { text: this.formatarDataPdf(item.dataPrevistaDevolucao), fontSize: 8, alignment: 'center' },
                      { text: this.formatarDataPdf(item.dataDevolucao) || '—', fontSize: 8, alignment: 'center' },
                      { text: item.statusEmprestimo, fontSize: 8, bold: true, color: statusColor, alignment: 'center' },
                      { text: item.nomeFuncionario || '—', fontSize: 8 }
                    ];
                  })
                ]
              },
              layout: {
                hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
                vLineWidth: () => 0,
                hLineColor: (i: number) => (i === 1) ? '#0e4c34' : '#e2e8f0',
                paddingLeft: () => 4,
                paddingRight: () => 4,
                paddingTop: () => 4,
                paddingBottom: () => 4
              }
            }
          : {
              text: 'Nenhum registro de empréstimo encontrado para os filtros selecionados.',
              style: 'emptyNotice'
            }
      ],
      styles: {
        institutionUpper: { fontSize: 8, bold: true, color: '#4a5568', letterSpacing: 0.5 },
        institutionMain: { fontSize: 13, bold: true, color: '#0e4c34', margin: [0, 1, 0, 1] },
        institutionSub: { fontSize: 8.5, color: '#4a5568' },
        reportTitle: { fontSize: 12, bold: true, color: '#167a54' },
        metaDate: { fontSize: 8, color: '#718096' },
        paramCell: { fontSize: 8.5, color: '#2d3748', padding: 4 },
        sectionHeader: { fontSize: 10, bold: true, color: '#0e4c34', margin: [0, 8, 0, 6], letterSpacing: 0.5 },
        metricHeader: { fontSize: 8, bold: true, color: '#4a5568', alignment: 'center', fillColor: '#edf2f7' },
        metricValue: { fontSize: 13, bold: true, alignment: 'center', margin: [0, 4, 0, 4] },
        tableHeader: { bold: true, fontSize: 8.5, color: '#ffffff', fillColor: '#0e4c34', alignment: 'center', padding: 4 },
        footerText: { fontSize: 7.5, color: '#a0aec0' },
        emptyNotice: { fontSize: 9, color: '#718096', italics: true, margin: [0, 10, 0, 0] }
      },
      defaultStyle: {
        fontSize: 9
      }
    };
  }

  private formatarDataPdf(valor: string | null | undefined): string {
    if (!valor) return '';
    const [ano, mes, dia] = valor.split('-');
    if (!ano || !mes || !dia) return valor;
    return `${dia}/${mes}/${ano}`;
  }

  private obterBlobPdf(pdf: PdfMakeDocument): Promise<Blob> {
    return pdf.getBlob();
  }
}
