import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PageNotFoundComponent } from './paginacao/page-not-found/page-not-found.component';
import { HomeComponent } from './paginacao/home/home.component';
import { AuthGuard } from './auth/guard.guard';
import { CadastroComponent } from './paginacao/cadastro/cadastro.component';
import { UsuarioComponent } from './paginacao/usuario/usuario.component';
import { PocoComponent } from './paginacao/poco/poco.component';
import { OperacaoComponent } from './paginacao/operacao/operacao.component';
import { OperadoraComponent } from './paginacao/operadora/operadora.component';
import { Component } from '@angular/core';
import { QuimicosComponent } from './paginacao/quimicos/quimicos.component';
import { FornecedorComponent } from './paginacao/fornecedor/fornecedor.component';
import { VeiculoComponent } from './paginacao/veiculo/veiculo.component';
import { AbastecimentoComponent } from './paginacao/abastecimento/abastecimento.component';

export const routes: Routes = [
    { path: '', component: LoginComponent }, // Rota para a Home
    { path: 'cadastro', component: CadastroComponent }, // Rota para a Home
    { path: 'usuario', component: UsuarioComponent }, // Rota para a Home
    { path: 'transporte', component: HomeComponent }, // Rota para a Home
    { path: 'contasapagar', component: HomeComponent }, // Rota para a Home
    { path: 'operacao', component: OperacaoComponent},
    { path: 'operadora', component:OperadoraComponent},
    { path: 'financeiro', component: HomeComponent }, // Rota para a Home
    { path: 'quimicos', component: QuimicosComponent}, 
    { path: 'app', component: HomeComponent }, // Rota para a Home
    { path: 'poco', component: PocoComponent},
    { path: 'veiculo', component: VeiculoComponent},
    { path: 'abastecimento', component:AbastecimentoComponent},
    { path: 'fornecedorquimico', component: FornecedorComponent},
    { path: '404', component: PageNotFoundComponent },
    { path: 'unauthorized', component: LoginComponent },
    { path: '**', redirectTo: '/404' } // Redireciona qualquer rota desconhecida para a página 404
];