import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export const Route = createFileRoute('/_authenticated/admin/import')({
  component: ImportModule,
});

function ImportModule() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast.error('Apenas arquivos .xlsx são permitidos.');
      return;
    }

    setFile(file);
    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheets = workbook.SheetNames;
      
      const rawData: any = {
        promoters: [],
        stores: [],
        industries: [],
        routes: [],
        ignoredSheets: []
      };

      for (const sheetName of sheets) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers: string[] = (jsonData[0] as string[]) || [];
        const rows = jsonData.slice(1);

        if (sheetName === 'PROMOTORES') {
          rawData.promoters = rows.map((row: any) => ({
            matricula: row[headers.indexOf('MATRÍCULA')],
            nome: row[headers.indexOf('NOME')],
            uf: row[headers.indexOf('UF')],
            cidade: row[headers.indexOf('CIDADE ATENDIMENTO')],
            contato: row[headers.indexOf('CONTATO')],
            observacao: row[headers.indexOf('OBSERVAÇÃO')]
          }));
        } else if (sheetName === 'LOJAS') {
          rawData.stores = rows.map((row: any) => ({
            rede: row[headers.indexOf('REDE')],
            loja: row[headers.indexOf('LOJA')],
            uf: row[headers.indexOf('UF')]
          }));
        } else if (sheetName === 'INDUSTRIA') {
          rawData.industries = rows.map((row: any) => ({
            nome: row[headers.indexOf('INDUSTRIA')]
          }));
        } else if (sheetName.startsWith('ROTEIRO ')) {
          rawData.routes.push({
            sheetName,
            stops: rows.map((row: any) => ({
              industria: row[headers.indexOf('INDUSTRIA')],
              loja: row[headers.indexOf('LOJA')],
              uf: row[headers.indexOf('UF')],
              promotor: row[headers.indexOf('PROMOTORES')],
              frequencia: row[headers.indexOf('FREQ')],
              dias: {
                seg: row[headers.indexOf('SEG')] === '✓',
                ter: row[headers.indexOf('TER')] === '✓',
                qua: row[headers.indexOf('QUA')] === '✓',
                qui: row[headers.indexOf('QUI')] === '✓',
                sex: row[headers.indexOf('SEX')] === '✓',
                sab: row[headers.indexOf('SAB')] === '✓',
                dom: row[headers.indexOf('DOM')] === '✓',
              }
            }))
          });
        } else if (!['CONSULTA LUCAS', 'CONSULTA ALEXANDRE', 'FREQUÊNCIA INDÚSTRIA'].includes(sheetName)) {
          rawData.ignoredSheets.push(sheetName);
        }
      }

      // Validation
      const inconsistencies: any[] = [];
      const normalizedPromoters = rawData.promoters.map((p: any) => p.nome?.trim().toLowerCase()).filter(Boolean);
      const normalizedStores = rawData.stores.map((s: any) => s.loja?.trim().toLowerCase()).filter(Boolean);
      const normalizedIndustries = rawData.industries.map((i: any) => i.nome?.trim().toLowerCase()).filter(Boolean);

      rawData.routes.forEach((routeSheet: any) => {
        const seenStops = new Set();
        routeSheet.stops.forEach((stop: any, index: number) => {
          const line = index + 2;
          
          // Required fields
          if (!stop.industria || !stop.loja || !stop.promotor) {
            inconsistencies.push({ type: 'Campo Obrigatório', detail: `Linha ${line} em ${routeSheet.sheetName} possui campos vazios.` });
          }

          // Reference checks
          if (stop.promotor && !normalizedPromoters.includes(stop.promotor.trim().toLowerCase())) {
            inconsistencies.push({ type: 'Promotor Não Encontrado', detail: `Promotor "${stop.promotor}" na linha ${line} de ${routeSheet.sheetName} não está na aba PROMOTORES.` });
          }
          if (stop.loja && !normalizedStores.includes(stop.loja.trim().toLowerCase())) {
            inconsistencies.push({ type: 'Loja Não Encontrada', detail: `Loja "${stop.loja}" na linha ${line} de ${routeSheet.sheetName} não está na aba LOJAS.` });
          }
          if (stop.industria && !normalizedIndustries.includes(stop.industria.trim().toLowerCase())) {
            inconsistencies.push({ type: 'Indústria Não Encontrada', detail: `Indústria "${stop.industria}" na linha ${line} de ${routeSheet.sheetName} não está na aba INDUSTRIA.` });
          }

          // Duplicate detection
          const stopKey = `${stop.industria}-${stop.loja}-${stop.promotor}-${routeSheet.sheetName}`.toLowerCase();
          if (seenStops.has(stopKey)) {
            inconsistencies.push({ type: 'Duplicidade', detail: `Linha ${line} em ${routeSheet.sheetName} é uma duplicata de parada.` });
          }
          seenStops.add(stopKey);

          // Frequency validation
          if (stop.frequencia && !['SEMANAL', 'QUINZENAL'].includes(stop.frequencia.toUpperCase())) {
            inconsistencies.push({ type: 'Frequência Inválida', detail: `Frequência "${stop.frequencia}" inválida na linha ${line} de ${routeSheet.sheetName}.` });
          }
        });
      });

      setPreviewData({ ...rawData, inconsistencies });
      toast.success('Arquivo processado com sucesso!');
    } catch (err) {
      toast.error('Erro ao processar arquivo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin' })}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-black text-slate-900">Importar Base Operacional</h1>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Upload de Planilha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input type="file" accept=".xlsx" onChange={handleFileUpload} className="max-w-xs" />
              {isLoading && <span className="text-sm text-slate-500">Processando...</span>}
            </div>
          </CardContent>
        </Card>

        {previewData && (
          <Tabs defaultValue="resumo">
            <TabsList>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="previa">Prévia de Importação</TabsTrigger>
              <TabsTrigger value="inconsistencias">Inconsistências</TabsTrigger>
            </TabsList>
            
            <TabsContent value="resumo">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm text-slate-500">Promotores</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black">{previewData.promoters.length}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm text-slate-500">Lojas</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black">{previewData.stores.length}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm text-slate-500">Indústrias</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black">{previewData.industries.length}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm text-slate-500">Linhas de Roteiro</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black">{previewData.routes.reduce((acc: number, r: any) => acc + r.data.length, 0)}</p></CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="previa">
              <Card>
                <CardContent className="p-4">
                  <p className="text-slate-500 italic text-sm">Prévia dos dados normalizados será exibida aqui.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="inconsistencias">
              <Card>
                <CardContent className="p-4">
                  <p className="text-slate-500 italic text-sm">Lista de inconsistências será exibida aqui.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <Button disabled className="font-bold">
            A gravação será implementada na próxima missão.
          </Button>
        </div>
      </div>
    </div>
  );
}
