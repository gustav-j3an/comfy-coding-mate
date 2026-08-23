import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, ChevronLeft, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useServerFn } from '@tanstack/react-start';
import { executeImport } from '@/lib/import.functions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/admin/import')({
  component: ImportModule,
});

function ImportModule() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validFrom, setValidFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const importFn = useServerFn(executeImport);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast.error('Apenas arquivos .xlsx são permitidos.');
      return;
    }

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
        
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null }) || [];
        if (!jsonData || !jsonData.length) continue;

        const headers: string[] = (jsonData[0] || []).map(h => String(h || '').trim().toUpperCase());
        const rows = jsonData.slice(1);

        if (sheetName === 'PROMOTORES') {
          const nameIdx = headers.indexOf('NOME');
          const matriculaIdx = headers.indexOf('MATRÍCULA');
          const ufIdx = headers.indexOf('UF');
          const cityIdx = headers.indexOf('CIDADE ATENDIMENTO');
          const contactIdx = headers.indexOf('CONTATO');
          const obsIdx = headers.indexOf('OBSERVAÇÃO');

          rawData.promoters = rows
            .filter(row => row[nameIdx] && String(row[nameIdx]).trim().length > 0)
            .map(row => ({
              matricula: row[matriculaIdx],
              nome: String(row[nameIdx]).trim(),
              uf: row[ufIdx],
              cidade: row[cityIdx],
              contato: row[contactIdx],
              observacao: row[obsIdx]
            }));
        } else if (sheetName === 'LOJAS') {
          const storeIdx = headers.indexOf('LOJA');
          const redeIdx = headers.indexOf('REDE');
          const ufIdx = headers.indexOf('UF');

          rawData.stores = rows
            .filter(row => row[storeIdx] && String(row[storeIdx]).trim().length > 0)
            .map(row => ({
              rede: row[redeIdx],
              loja: String(row[storeIdx]).trim(),
              uf: row[ufIdx]
            }));
        } else if (sheetName === 'INDUSTRIA') {
          const indIdx = headers.indexOf('INDUSTRIA');

          rawData.industries = rows
            .filter(row => row[indIdx] && String(row[indIdx]).trim().length > 0)
            .map(row => ({
              nome: String(row[indIdx]).trim()
            }));
        } else if (sheetName.startsWith('ROTEIRO ')) {
          const indIdx = headers.indexOf('INDUSTRIA');
          const storeIdx = headers.indexOf('LOJA');
          const promIdx = headers.indexOf('PROMOTORES');
          const freqIdx = headers.indexOf('FREQ');
          
          const segIdx = headers.indexOf('SEG');
          const terIdx = headers.indexOf('TER');
          const quaIdx = headers.indexOf('QUA');
          const quiIdx = headers.indexOf('QUI');
          const sexIdx = headers.indexOf('SEX');
          const sabIdx = headers.indexOf('SAB');
          const domIdx = headers.indexOf('DOM');

          const validStops = rows.filter(row => {
            const hasBasic = row[indIdx] && row[storeIdx] && row[promIdx] && row[freqIdx];
            if (!hasBasic) return false;

            const hasDay = [segIdx, terIdx, quaIdx, quiIdx, sexIdx, sabIdx, domIdx].some(idx => 
              idx !== -1 && (row[idx] === '✓' || row[idx] === 'v' || row[idx] === 'V' || String(row[idx]).toLowerCase() === 'x')
            );
            return hasDay;
          }).map(row => ({
            industria: String(row[indIdx]).trim(),
            loja: String(row[storeIdx]).trim(),
            promotor: String(row[promIdx]).trim(),
            frequencia: String(row[freqIdx]).trim(),
            dias: {
              seg: row[segIdx] === '✓',
              ter: row[terIdx] === '✓',
              qua: row[quaIdx] === '✓',
              qui: row[quiIdx] === '✓',
              sex: row[sexIdx] === '✓',
              sab: row[sabIdx] === '✓',
              dom: row[domIdx] === '✓',
            }
          }));

          if (validStops.length > 0) {
            rawData.routes.push({
              sheetName,
              stops: validStops
            });
          }
        } else if (!['CONSULTA LUCAS', 'CONSULTA ALEXANDRE', 'FREQUÊNCIA INDÚSTRIA', 'CONSULTA'].includes(sheetName)) {
          rawData.ignoredSheets.push(sheetName);
        }
      }

      // Validation & Metrics
      const inconsistencies: any[] = [];
      const normalizedPromoters = new Set(rawData.promoters.map((p: any) => p.nome.toLowerCase()));
      const normalizedStores = new Set(rawData.stores.map((s: any) => s.loja.toLowerCase()));
      const normalizedIndustries = new Set(rawData.industries.map((i: any) => i.nome.toLowerCase()));

      const distinctPromotersInRoutes = new Set();
      const distinctStoresInRoutes = new Set();
      const distinctIndustriesInRoutes = new Set();
      let totalStopsCount = 0;

      const seenStops = new Map();

      rawData.routes.forEach((routeSheet: any) => {
        routeSheet.stops.forEach((stop: any, index: number) => {
          const line = index + 2;
          
          distinctPromotersInRoutes.add(stop.promotor.toLowerCase());
          distinctStoresInRoutes.add(stop.loja.toLowerCase());
          distinctIndustriesInRoutes.add(stop.industria.toLowerCase());
          
          Object.values(stop.dias).forEach(val => { if (val) totalStopsCount++; });

          // Reference checks
          if (!normalizedPromoters.has(stop.promotor.toLowerCase())) {
            inconsistencies.push({ type: 'Promotor Não Encontrado', detail: `Promotor "${stop.promotor}" na linha ${line} de ${routeSheet.sheetName} não está na aba PROMOTORES.` });
          }
          if (!normalizedStores.has(stop.loja.toLowerCase())) {
            inconsistencies.push({ type: 'Loja Não Encontrada', detail: `Loja "${stop.loja}" na linha ${line} de ${routeSheet.sheetName} não está na aba LOJAS.` });
          }
          if (!normalizedIndustries.has(stop.industria.toLowerCase())) {
            inconsistencies.push({ type: 'Indústria Não Encontrada', detail: `Indústria "${stop.industria}" na linha ${line} de ${routeSheet.sheetName} não está na aba INDUSTRIA.` });
          }

          // Duplicate detection
          const stopKey = `${stop.industria}|${stop.loja}|${stop.promotor}|${stop.frequencia}`.toLowerCase();
          if (seenStops.has(stopKey)) {
            const original = seenStops.get(stopKey);
            inconsistencies.push({ 
              type: 'Duplicidade', 
              detail: `Parada duplicada na linha ${line} de ${routeSheet.sheetName}. (Mesma combinação de Indústria, Loja, Promotor e Frequência já vista em ${original.sheetName} na linha ${original.line})` 
            });
          } else {
            seenStops.set(stopKey, { sheetName: routeSheet.sheetName, line });
          }
        });
      });

      setPreviewData({ 
        ...rawData, 
        inconsistencies,
        metrics: {
          distinctPromoters: distinctPromotersInRoutes.size,
          distinctStores: distinctStoresInRoutes.size,
          distinctIndustries: distinctIndustriesInRoutes.size,
          totalStopMarkings: totalStopsCount
        }
      });
      toast.success('Arquivo processado com sucesso!');
    } catch (err) {
      toast.error('Erro ao processar arquivo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  const handleImport = async () => {
    if (!previewData || !validFrom || !acceptedTerms) return;
    
    setIsImporting(true);
    try {
      const res = await importFn({
        validFrom,
        promoters: previewData.promoters,
        stores: previewData.stores,
        industries: previewData.industries,
        routes: previewData.routes
      });

      if (res.success) {
        setImportResult(res.results);
        toast.success('Importação realizada com sucesso!');
      } else {
        toast.error(`Erro na importação: ${res.error}`);
      }
    } catch (err: any) {
      toast.error('Erro crítico na importação.');
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  if (role !== 'admin') return null;

  const requiresRevision = (previewData?.inconsistencies?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin' })}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <h1 className="text-2xl font-black text-slate-900">Importar Base Operacional</h1>
          </div>
          {requiresRevision && (
            <Badge variant="destructive" className="animate-pulse">REQUER REVISÃO</Badge>
          )}
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
                  <CardHeader><CardTitle className="text-xs text-slate-500 uppercase tracking-widest">Promotores</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black">{previewData.promoters.length}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-xs text-slate-500 uppercase tracking-widest">Lojas</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black">{previewData.stores.length}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-xs text-slate-500 uppercase tracking-widest">Indústrias</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black">{previewData.industries.length}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-xs text-slate-500 uppercase tracking-widest">Roteiros Válidos</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-black text-blue-600">{previewData.routes.reduce((acc: number, r: any) => acc + r.stops.length, 0)}</p></CardContent>
                </Card>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 opacity-80">
                <Card className="bg-slate-50/50">
                  <CardHeader className="py-2"><CardTitle className="text-[10px] text-slate-400 uppercase tracking-widest">Promotores em Roteiro</CardTitle></CardHeader>
                  <CardContent className="py-2"><p className="text-lg font-bold">{previewData.metrics.distinctPromoters}</p></CardContent>
                </Card>
                <Card className="bg-slate-50/50">
                  <CardHeader className="py-2"><CardTitle className="text-[10px] text-slate-400 uppercase tracking-widest">Lojas em Roteiro</CardTitle></CardHeader>
                  <CardContent className="py-2"><p className="text-lg font-bold">{previewData.metrics.distinctStores}</p></CardContent>
                </Card>
                <Card className="bg-slate-50/50">
                  <CardHeader className="py-2"><CardTitle className="text-[10px] text-slate-400 uppercase tracking-widest">Indústrias em Roteiro</CardTitle></CardHeader>
                  <CardContent className="py-2"><p className="text-lg font-bold">{previewData.metrics.distinctIndustries}</p></CardContent>
                </Card>
                <Card className="bg-slate-50/50">
                  <CardHeader className="py-2"><CardTitle className="text-[10px] text-slate-400 uppercase tracking-widest">Total de Paradas Semanais</CardTitle></CardHeader>
                  <CardContent className="py-2"><p className="text-lg font-bold text-green-600">{previewData.metrics.totalStopMarkings}</p></CardContent>
                </Card>
              </div>
              
              <div className="mt-6 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Abas Processadas</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">PROMOTORES</Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">LOJAS</Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">INDUSTRIA</Badge>
                    {previewData.routes.map((r: any) => (
                      <Badge key={r.sheetName} variant="outline" className="bg-blue-50 text-blue-700">{r.sheetName}</Badge>
                    ))}
                  </CardContent>
                </Card>

                {previewData.ignoredSheets.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Abas Ignoradas</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {previewData.ignoredSheets.map((s: string) => (
                        <Badge key={s} variant="outline" className="bg-slate-100 text-slate-500">{s}</Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="previa">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados Normalizados</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="text-left py-2 px-4">Indústria</th>
                        <th className="text-left py-2 px-4">Loja</th>
                        <th className="text-left py-2 px-4">Promotor</th>
                        <th className="text-left py-2 px-4">Freq</th>
                        <th className="text-center py-2 px-4">S</th>
                        <th className="text-center py-2 px-4">T</th>
                        <th className="text-center py-2 px-4">Q</th>
                        <th className="text-center py-2 px-4">Q</th>
                        <th className="text-center py-2 px-4">S</th>
                        <th className="text-center py-2 px-4">S</th>
                        <th className="text-center py-2 px-4">D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.routes.flatMap((rs: any) => rs.stops.slice(0, 20)).map((stop: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-4">{stop.industria}</td>
                          <td className="py-2 px-4">{stop.loja}</td>
                          <td className="py-2 px-4">{stop.promotor}</td>
                          <td className="py-2 px-4 font-bold text-[10px]">{stop.frequencia}</td>
                          <td className="text-center py-2 px-4">{stop.dias.seg ? '✓' : ''}</td>
                          <td className="text-center py-2 px-4">{stop.dias.ter ? '✓' : ''}</td>
                          <td className="text-center py-2 px-4">{stop.dias.qua ? '✓' : ''}</td>
                          <td className="text-center py-2 px-4">{stop.dias.qui ? '✓' : ''}</td>
                          <td className="text-center py-2 px-4">{stop.dias.sex ? '✓' : ''}</td>
                          <td className="text-center py-2 px-4">{stop.dias.sab ? '✓' : ''}</td>
                          <td className="text-center py-2 px-4">{stop.dias.dom ? '✓' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.routes.reduce((acc: number, r: any) => acc + r.stops.length, 0) > 20 && (
                    <p className="mt-4 text-slate-500 italic text-xs text-center">Exibindo apenas as primeiras 20 linhas de roteiro.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inconsistencias">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Inconsistências Detectadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {previewData.inconsistencies.length > 0 ? (
                    <div className="space-y-3">
                      {previewData.inconsistencies.map((err: any, i: number) => (
                        <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-black text-amber-900 uppercase tracking-tighter">{err.type}</p>
                            <p className="text-sm text-amber-800">{err.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-400">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                      <p>Nenhuma inconsistência detectada!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {importResult ? (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Importação Concluída
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-green-600 uppercase font-bold">Promotores</p>
                  <p className="text-lg font-black">{importResult.promoters.created} criados, {importResult.promoters.ignored} ignorados</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 uppercase font-bold">Lojas</p>
                  <p className="text-lg font-black">{importResult.stores.created} criadas, {importResult.stores.ignored} ignoradas</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 uppercase font-bold">Indústrias</p>
                  <p className="text-lg font-black">{importResult.industries.created} criadas, {importResult.industries.ignored} ignoradas</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 uppercase font-bold">Roteiros</p>
                  <p className="text-lg font-black text-blue-700">{importResult.routes.created} roteiros em rascunho</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mt-4 p-3 bg-white border border-red-200 rounded-lg">
                  <p className="text-xs font-bold text-red-600 uppercase mb-2">Alertas/Pendências</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {importResult.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  setPreviewData(null);
                  setImportResult(null);
                  setAcceptedTerms(false);
                }}
              >
                Nova Importação
              </Button>
            </CardContent>
          </Card>
        ) : previewData && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Save className="h-5 w-5 text-blue-600" />
                Confirmação de Gravação Segura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="validFrom" className="text-sm font-bold">Data de Vigência Inicial (Obrigatória)</Label>
                  <Input 
                    id="validFrom"
                    type="date" 
                    value={validFrom} 
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-slate-500">Esta data será usada como início da validade dos roteiros e ciclos quinzenais.</p>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-blue-100 space-y-3">
                  <p className="text-sm font-bold text-slate-700">Resumo da Operação:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Criar {previewData.promoters.length} registros de Promotores (se novos)</li>
                    <li>• Criar {previewData.stores.length} registros de Lojas (se novas)</li>
                    <li>• Criar {previewData.industries.length} registros de Indústrias (se novas)</li>
                    <li>• Gerar {previewData.routes.length} Roteiros em <span className="font-bold text-amber-600">RASCUNHO</span></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms} 
                  onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-amber-900"
                  >
                    Entendo que os roteiros serão importados como rascunho e não gerarão visitas automaticamente.
                  </Label>
                  <p className="text-xs text-amber-700">
                    Nenhuma alteração será feita em usuários existentes ou roteiros publicados.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPreviewData(null)}
                  disabled={isImporting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={!acceptedTerms || !validFrom || isImporting || requiresRevision}
                  className="bg-blue-600 hover:bg-blue-700 font-bold min-w-[200px]"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gravando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Confirmar Importação Segura
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!previewData && !importResult && (
          <div className="flex justify-end pt-6 border-t border-slate-200">
            <Button disabled className="font-bold">
              Selecione um arquivo para iniciar a importação.
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
