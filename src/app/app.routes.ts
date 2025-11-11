// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PageNotFoundComponent } from './paginacao/page-not-found/page-not-found.component';
import { HomeComponent } from './paginacao/home/home.component';
import { CadastroComponent } from './paginacao/cadastro/cadastro.component';
import { UsuarioComponent } from './paginacao/usuario/usuario.component';
import { PocoComponent } from './paginacao/poco/poco.component';
import { OperacaoComponent } from './paginacao/operacao/operacao.component';
import { OperadoraComponent } from './paginacao/operadora/operadora.component';
import { QuimicosComponent } from './paginacao/quimicos/quimicos.component';
import { FornecedorComponent } from './paginacao/fornecedor/fornecedor.component';
import { VeiculoComponent } from './paginacao/veiculo/veiculo.component';
import { AbastecimentoComponent } from './paginacao/abastecimento/abastecimento.component';
import { LogoutComponent } from './paginacao/utilities/logout/logout.component';
import { roleGuard } from './guardian/role.guard';
import { ReporterOperadorComponent } from './paginacao/reporter-operador/reporter-operador.component';
import { ReporteCampoComponent } from './paginacao/reporte-campo/reporte-campo.component';
import { ReporteCampoObservacaoComponent } from './paginacao/reporte-campo-observacao/reporte-campo-observacao.component';
export const routes: Routes = [
  // ===== PÚBLICAS =====
  { path: '', component: LoginComponent },
  { path: '404', component: PageNotFoundComponent },
  { path: 'unauthorized', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'reporter-operador', component: ReporterOperadorComponent },

  // ===== PROTEGIDAS: ROLE_MASTER =====
  { path: 'app', component: HomeComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'transporte', component: HomeComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'contasapagar', component: HomeComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'operacao', component: OperacaoComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'operadora', component: OperadoraComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'financeiro', component: HomeComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'reporte-campo', component: ReporteCampoComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'reporte-campo-observacao/:id', component: ReporteCampoObservacaoComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'quimicos', component: QuimicosComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'poco', component: PocoComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'usuario', component: UsuarioComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'veiculo', component: VeiculoComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'abastecimento', component: AbastecimentoComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },
  { path: 'fornecedorquimico', component: FornecedorComponent, canActivate: [roleGuard()], data: { roles: ['ROLE_MASTER'] } },

  // catch-all
  { path: '**', redirectTo: '/404' },
];
