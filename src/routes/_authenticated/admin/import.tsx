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
      
      const parsedData: any = {
        promoters: [],
        stores: [],
        industries: [],
        routes: [],
        ignoredSheets: [],
        errors: []
      };

      sheets.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (sheetName === 'PROMOTORES') {
          parsedData.promoters = jsonData.slice(1);
        } else if (sheetName === 'LOJAS') {
          parsedData.stores = jsonData.slice(1);
        } else if (sheetName === 'INDUSTRIA') {
          parsedData.industries = jsonData.slice(1);
        } else if (sheetName.startsWith('ROTEIRO ')) {
          parsedData.routes.push({ sheetName, data: jsonData.slice(1) });
        } else if (!['CONSULTA LUCAS', 'CONSULTA ALEXANDRE', 'FREQUÊNCIA INDÚSTRIA'].includes(sheetName)) {
          parsedData.ignoredSheets.push(sheetName);
        }
      });

      setPreviewData(parsedData);
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
