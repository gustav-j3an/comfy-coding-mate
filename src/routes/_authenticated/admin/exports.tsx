import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, FileSpreadsheet, FileText, 
  Database, Clock, ChevronRight, Filter,
  Share2, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/_authenticated/admin/exports')({
  component: ExportsPage,
});

function ExportsPage() {
  const exports = [
    { name: 'Base Completa de Lojas', type: 'Excel', size: '124 KB', last: 'Ontem, 14:20' },
    { name: 'Histórico de Visitas (30 dias)', type: 'CSV', size: '2.4 MB', last: 'Há 2 horas' },
    { name: 'Ocorrências e Rupturas', type: 'PDF', size: '890 KB', last: 'Há 5 min' },
    { name: 'Dados de Promotores', type: 'Excel', size: '45 KB', last: '02/08/2026' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Exportações</h2>
          <p className="text-sm text-slate-500">Extração de dados e backups</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold">
          <Zap className="mr-2 h-4 w-4" /> Nova Exportação
        </Button>
      </header>

      <div className="p-6 space-y-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm hover:border-blue-200 transition-colors cursor-pointer group">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Relatório em Excel</CardTitle>
                <CardDescription>Planilhas completas com filtros avançados</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:border-blue-200 transition-colors cursor-pointer group">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Dump de Dados (JSON)</CardTitle>
                <CardDescription>Integração com outros sistemas de BI</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Arquivos Recentes</h3>
          <div className="grid gap-3">
            {exports.map((exp, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-500">
                    {exp.type === 'Excel' ? <FileSpreadsheet className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{exp.name}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{exp.type} • {exp.size}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                        <Clock className="w-3 h-3" />
                        {exp.last}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 border-slate-200 text-blue-600 font-bold hover:bg-blue-50">
                    <Download className="h-3.5 w-3.5 mr-1" /> BAIXAR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
