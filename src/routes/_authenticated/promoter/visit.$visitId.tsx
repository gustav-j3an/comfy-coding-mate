import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/auth-context';
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Video, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  ChevronLeft,
  Loader2,
  Trash2,
  AlertCircle,
  Wifi,
  WifiOff,
  Save,
  RefreshCw,
  Clock,
  Images,
  GalleryVertical
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { 
  submitVisit, 
  getSignedUrl, 
  getPromoterVisitExecution,
  requestEvidenceUpload,
  confirmEvidenceUpload
} from '@/lib/execution.functions';
import { toast } from 'sonner';
import { 
  saveVisitDraft, 
  getVisitDraft, 
  deleteVisitDraft, 
  addToSyncQueue, 
  removeFromSyncQueue, 
  isOnline 
} from '@/lib/offline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/promoter/visit/$visitId')({
  validateSearch: (search: Record<string, unknown>) => ({
    industryId: typeof search['industryId'] === 'string' ? search['industryId'] : undefined,
  }),
  component: VisitExecution,
});

function VisitExecution() {
  const { visitId } = Route.useParams();
  const { industryId: requestedIndustryId } = Route.useSearch();
  const { user, previewPromoter } = useAuth();
  const navigate = useNavigate();
  const { coords, loading: loadingGeo } = useGeolocation();
  
  const [observation, setObservation] = useState('');
  const [evidences, setEvidences] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [checkinTime] = useState(new Date().toISOString());
  const [missingEvidences, setMissingEvidences] = useState<string[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  
  const [online, setOnline] = useState(isOnline());
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadContextRef = useRef<{ industryId: string; evidenceType: string } | null>(null);
  const [activeEvidenceType, setActiveEvidenceType] = useState<string>('');
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>(requestedIndustryId || '');

  useEffect(() => {
    setSelectedIndustryId(requestedIndustryId || '');
    setObservation('');
    setEvidences([]);
    setOccurrences([]);
    setIsRestored(false);
    setSignedUrls({});
  }, [visitId, requestedIndustryId]);

  // Handle online/offline status
  useEffect(() => {
    const handleStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Restore draft on load
  useEffect(() => {
    async function restoreDraft() {
      if (!user?.id) return;
      if (!requestedIndustryId) return;
      const draft = await getVisitDraft(user.id, visitId, requestedIndustryId);
      if (draft && !isRestored) {
        setObservation(draft.observation || '');
        setEvidences(draft.evidences || []);
        setOccurrences(draft.occurrences || []);
        setLastSaved(draft.lastSaved);
        setIsRestored(true);
        toast.info("Rascunho restaurado automaticamente.");
      }
      setIsRestored(true);
    }
    restoreDraft();
  }, [visitId, isRestored]);

  // Auto-save draft
  useEffect(() => {
    if (!visitId || !user?.id || !selectedIndustryId) return;
    
    const saveTimer = setTimeout(async () => {
      const draft = await saveVisitDraft(user.id, {
        visitId,
        industryId: selectedIndustryId,
        executorId: user.id,
        checkinAt: checkinTime,
        observation,
        evidences,
        occurrences,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        status: missingEvidences.length > 0 ? 'awaiting_media' : 'offline_draft'
      });
      setLastSaved(draft.lastSaved);
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [observation, evidences, occurrences, coords, visitId, user?.id, checkinTime, selectedIndustryId]);

  const { data: executionData, error: loadError } = useSuspenseQuery({
    queryKey: ['visit-execution', visitId, requestedIndustryId ?? null],
    queryFn: async () => {
      try {
        const result = await getPromoterVisitExecution({ data: { visitId, industryId: requestedIndustryId } });
        return result;
      } catch (err: any) {
        console.error("Error loading visit execution:", err);
        throw err;
      }
    }
  });

  const visit = executionData?.visit;
  const store = executionData?.store;
  const industries = executionData?.industries || [];
  const activeIndustry = industries.find((ind: any) => ind.id === selectedIndustryId);
  const activeIndustries = activeIndustry ? [activeIndustry] : [];

  useEffect(() => {
    const loaded = (executionData?.evidences || []).map((e: any) => ({
      id: e.id,
      filePath: e.file_path,
      fileType: e.file_type,
      evidenceType: e.evidence_type,
      industryId: e.industry_id,
    })).filter((e: any) => e.industryId === selectedIndustryId);
    setEvidences((current) => current.length ? current : loaded);
    Promise.all(loaded.map(async (e: any) => {
      try { return [e.filePath, await getSignedUrl({ data: { filePath: e.filePath } })]; } catch { return null; }
    })).then((entries) => setSignedUrls(Object.fromEntries(entries.filter(Boolean) as [string, string][])));
  }, [executionData, selectedIndustryId]);

  // Check for mandatory evidence requirements
  useEffect(() => {
    // Only replenishment evidence is mandatory per industry.
    const missing: string[] = [];
    
    (selectedIndustryId ? industries.filter((ind: any) => ind.id === selectedIndustryId) : []).forEach((ind: any) => {
      const hasReposicao = evidences.some(e => 
        e.evidenceType === 'replenishment' && e.industryId === ind.id
      );
      if (hasReposicao) return;
      
      // Mandatory for specified industries or if it's the main industry of the visit
      if (['KING', 'DON LUIZ', 'FRUTA POLPA'].includes(ind.name) || ind.id === selectedIndustryId) {
        missing.push(ind.name);
      }
    });

    setMissingEvidences(missing);

    // Update draft status if offline
    if (user?.id && isRestored) {
      const updateStatus = async () => {
        const draft = await getVisitDraft(user.id, visitId, selectedIndustryId);
        if (draft && (draft.status === 'awaiting_media' || draft.status === 'offline_draft' || draft.status === 'ready_to_send')) {
          const newStatus = missing.length > 0 ? 'awaiting_media' : 'ready_to_send';
          if (draft.status !== newStatus) {
            await saveVisitDraft(user.id, {
              ...draft,
              status: newStatus
            });
          }
        }
      };
      updateStatus();
    }
  }, [evidences, user?.id, visitId, isRestored, industries, selectedIndustryId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (previewPromoter) {
      toast.warning("Modo Visualização: O upload de mídias está bloqueado.");
      return;
    }
    const file = e.target.files?.[0];
    const uploadContext = uploadContextRef.current;
    if (!file || !uploadContext) return;
    const uploadIndustryId = uploadContext.industryId;
    const uploadEvidenceType = uploadContext.evidenceType;

    // Validate image formats (Mission E2.1)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido: Aceitamos apenas JPG, PNG e WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande: Fotos devem ter no máximo 5MB");
      return;
    }

    try {
      setUploading(true);
      const localPreview = URL.createObjectURL(file);
      const pendingId = `pending-${Date.now()}`;
      setEvidences((current) => [...current, { id: pendingId, filePath: localPreview, fileType: file.type, evidenceType: uploadEvidenceType, industryId: uploadIndustryId, pending: true }]);
      // 1. Request upload authorization
      const { uploadUrl, filePath, token } = await requestEvidenceUpload({
        data: {
          visitId,
          industryId: uploadIndustryId,
          evidenceType: uploadEvidenceType,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }
      });

      // 2. Perform the upload to storage
      // Note: We use the signed URL directly. 
      // Supabase storage signed URLs for upload usually expect the file in the body.
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-upsert': 'true'
        }
      });

      if (!response.ok) {
        throw new Error("Falha no upload para o Storage.");
      }

      // 3. Confirm upload and create DB record
      const evidence = await confirmEvidenceUpload({
        data: {
          visitId,
          industryId: uploadIndustryId,
          evidenceType: uploadEvidenceType,
          filePath,
          fileType: file.type
        }
      });

      setEvidences((current) => [...current.filter((e) => e.id !== pendingId), {
        id: evidence.id,
        filePath: evidence.file_path,
        fileType: evidence.file_type,
        evidenceType: evidence.evidence_type,
        industryId: evidence.industry_id
      }]);

      URL.revokeObjectURL(localPreview);
      toast.success("Evidência enviada.");
      
      // Get signed URL for preview
      try {
        const url = await getSignedUrl({ data: { filePath } });
        setSignedUrls(prev => ({ ...prev, [filePath]: url }));
      } catch (err) {
        console.error("Error getting preview URL:", err);
      }
    } catch (error: any) {
      console.error("Upload error details:", error);
      toast.error("Falha no envio — Tentar novamente");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerUpload = (type: string) => {
    if (!selectedIndustryId) return;
    uploadContextRef.current = { industryId: selectedIndustryId, evidenceType: type };
    setActiveEvidenceType(type);
    fileInputRef.current?.click();
  };

  const triggerIndustryUpload = (industryId: string, type: string) => {
    uploadContextRef.current = { industryId, evidenceType: type };
    setSelectedIndustryId(industryId);
    setActiveEvidenceType(type);
    fileInputRef.current?.click();
  };

  const addOccurrence = (type: string) => {
    // Basic occurrence structure for now
    setOccurrences([...occurrences, {
      type,
      industryId: selectedIndustryId,
      storeId: store?.id,
      description: `Ocorrência de ${type} registrada pelo promotor.`
    }]);
  };

  const handleSubmit = async () => {
    if (previewPromoter) {
      toast.warning("Modo Visualização: O envio de visitas está bloqueado.");
      return;
    }

    if (missingEvidences.length > 0) {
      toast.error(`Foto de reposição pendente: ${missingEvidences.join(', ')}`);
      return;
    }

    if (!online) {
      await saveVisitDraft(user!.id, {
        visitId,
        industryId: selectedIndustryId,
        executorId: user!.id,
        checkinAt: checkinTime,
        observation,
        evidences,
        occurrences,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        status: 'awaiting_connection'
      });
      await addToSyncQueue(user!.id, visitId);
      toast.warning("Visita salva offline. O envio ocorrerá automaticamente quando houver conexão.");
      navigate({ to: '/promoter' });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVisit({
        data: {
          visitId,
          executorId: user!.id,
          checkinAt: checkinTime,
          checkoutAt: new Date().toISOString(),
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          observation,
          evidences,
          occurrences
        }
      });

      await deleteVisitDraft(user!.id, visitId, selectedIndustryId);
      await removeFromSyncQueue(user!.id, visitId);
      
      toast.success("Visita enviada para conferência administrativa.");
      navigate({ to: '/promoter' });
    } catch (error: any) {
      console.error("Submit error:", error);
      await addToSyncQueue(user!.id, visitId);
      toast.error("Erro ao enviar. O rascunho foi mantido na fila de sincronização.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedIndustryId) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <Card className="mx-auto mt-12 max-w-lg">
          <CardContent className="p-6 space-y-4">
            <h1 className="text-xl font-bold">Selecionar indústria</h1>
            <p className="text-sm text-slate-500">Escolha a indústria desta execução. Nenhuma indústria será selecionada automaticamente.</p>
            {industries.map((ind: any) => (
              <Button key={ind.id} variant="outline" className="w-full justify-start" onClick={() => navigate({ to: "/promoter/visit/$visitId", params: { visitId }, search: { industryId: ind.id } })}>
                {ind.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <button onClick={() => navigate({ to: '/promoter' })}>
              <ChevronLeft className="h-6 w-6" />
            </button>
          </Button>
          <h1 className="font-bold text-lg">Executar visita — {activeIndustry?.name}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {online ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
              <Wifi className="h-3 w-3 mr-1" /> Online
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
              <WifiOff className="h-3 w-3 mr-1" /> Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Validation Alerts */}
        {missingEvidences.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-800">Fotos de Reposição Obrigatórias Faltando</p>
              <p className="text-amber-700">Para concluir esta visita, você precisa anexar foto de reposição para: <span className="font-bold">{missingEvidences.join(', ')}</span>.</p>
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="flex justify-between items-center px-1">
          {lastSaved && (
            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Save className="h-3 w-3 mr-1" />
              Rascunho salvo: {format(new Date(lastSaved), "HH:mm:ss", { locale: ptBR })}
            </div>
          )}
          {!online && (
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider animate-pulse">
              {missingEvidences.length > 0 ? (
                <span className="text-amber-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Aguardando Mídias
                </span>
              ) : (
                <span className="text-orange-500 flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Aguardando Conexão
                </span>
              )}
            </div>
          )}
        </div>
        {/* Info Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-slate-800">{store?.name}</h2>
              <div className="flex flex-wrap gap-1">
                {activeIndustries.map((ind: any, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{ind?.name}</Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {store?.address}
            </p>
          </CardContent>
        </Card>

        {/* Add Photos Button */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {activeIndustries.map((ind: any) => (
              <div key={ind.id} className="w-full space-y-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-700">{ind.name}</span>
                   {evidences.some(e => e.industryId === ind.id && e.evidenceType === 'replenishment' && !e.pending) ? (
                    <Badge className="bg-green-100 text-green-700 border-none">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Enviada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">Foto obrigatória</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-20 gap-1 border-blue-100 bg-blue-50/30 hover:bg-blue-50"
                    onClick={() => {
                      triggerIndustryUpload(ind.id, 'replenishment');
                    }}
                  >
                    <Camera className="h-5 w-5 text-blue-600" />
                    <span className="text-[10px] font-bold">Foto Reposição</span>
                  </Button>
                  
                  <div className="grid grid-rows-2 gap-1">
                    <Button 
                      variant="ghost" 
                      className="h-9 text-[10px] border border-slate-100 bg-slate-50/50"
                      onClick={() => {
                        triggerIndustryUpload(ind.id, 'report');
                      }}
                    >
                      <Images className="h-3.5 w-3.5 mr-1 text-orange-500" /> Foto Relatório
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-9 text-[10px] border border-slate-100 bg-slate-50/50"
                      onClick={() => {
                        triggerIndustryUpload(ind.id, 'occurrence');
                      }}
                    >
                      <AlertCircle className="h-3.5 w-3.5 mr-1 text-red-500" /> Foto Ocorrência
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
        />

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-blue-600">
              <span>Enviando arquivo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Evidence List */}
        {evidences.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">Evidências Anexadas ({evidences.length})</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(evidences as any[]).map((ev, i) => (
                <div key={i} className="relative bg-slate-200 w-20 h-20 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                   {ev.fileType.startsWith('image/') ? (
                    <img 
                      src={ev.pending ? ev.filePath : signedUrls[ev.filePath] || ''}
                      className="w-full h-full object-cover" 
                      alt="evidencia"
                  />
                  ) : (
                    <FileText className="h-8 w-8 text-slate-400" />
                  )}
                  {ev.pending && <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[9px] text-center">Enviando...</span>}
                  <button 
                    onClick={() => setEvidences(evidences.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Occurrences section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Ocorrências</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200" onClick={() => addOccurrence('ruptura')}>
              <AlertCircle className="h-4 w-4 mr-1" /> Ruptura
            </Button>
            <Button size="sm" variant="ghost" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200" onClick={() => addOccurrence('vencido')}>
              <AlertCircle className="h-4 w-4 mr-1" /> Vencido
            </Button>
            <Button size="sm" variant="ghost" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" onClick={() => addOccurrence('preco_errado')}>
              <AlertCircle className="h-4 w-4 mr-1" /> Preço Errado
            </Button>
          </div>
          
          {occurrences.length > 0 && (
            <div className="space-y-2 mt-2">
              {(occurrences as any[]).map((oc, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border text-sm">
                  <span className="capitalize font-medium">{oc.type}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOccurrences(occurrences.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observations */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700">Observações</h3>
          <Textarea 
            placeholder="Alguma observação importante sobre esta visita?"
            className="bg-white"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
          />
        </div>

        {/* GPS Status */}
        <div className={`p-3 rounded-lg flex items-center text-xs font-medium ${coords ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          <MapPin className="h-4 w-4 mr-2" />
          {loadingGeo ? 'Obtendo localização...' : coords ? `Localização capturada: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : 'Falha ao obter localização'}
        </div>

        {/* Submit */}
        <Button 
          className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={handleSubmit}
          disabled={isSubmitting || loadingGeo}
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...</>
          ) : (
            <>{online ? 'Enviar para Conferência' : 'Salvar Offline'} <CheckCircle2 className="ml-2 h-5 w-5" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
