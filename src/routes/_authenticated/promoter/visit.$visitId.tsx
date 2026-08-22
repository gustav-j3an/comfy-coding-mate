import { createFileRoute, useNavigate } from '@tanstack/react-router';
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
  AlertCircle
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { submitVisit } from '@/lib/execution.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/promoter/visit/$visitId')({
  component: VisitExecution,
});

function VisitExecution() {
  const { visitId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { coords, loading: loadingGeo } = useGeolocation();
  
  const [observation, setObservation] = useState('');
  const [evidences, setEvidences] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkinTime] = useState(new Date().toISOString());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeEvidenceType, setActiveEvidenceType] = useState<string>('');

  const { data: visit } = useSuspenseQuery({
    queryKey: ['visit-details', visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          store:stores(*),
          industry:industries(*)
        `)
        .eq('id', visitId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEvidenceType) return;

    // Validate size (Mission 4 rules)
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';

    if (isImage && file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande: Fotos devem ter no máximo 2MB");
      return;
    }
    if (isVideo && file.size > 30 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Vídeos devem ter no máximo 30MB", variant: "destructive" });
      return;
    }
    if (isPdf && file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "PDFs devem ter no máximo 10MB", variant: "destructive" });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${visitId}/${activeEvidenceType}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `evidences/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('visit-evidences')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setEvidences([...evidences, {
        filePath,
        fileType: file.type,
        evidenceType: activeEvidenceType
      }]);

      toast({ title: "Arquivo enviado", description: "Evidência anexada com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    }
  };

  const triggerUpload = (type: string) => {
    setActiveEvidenceType(type);
    fileInputRef.current?.click();
  };

  const addOccurrence = (type: string) => {
    // Basic occurrence structure for now
    setOccurrences([...occurrences, {
      type,
      industryId: visit.industry_id,
      storeId: visit.store_id,
      description: `Ocorrência de ${type} registrada pelo promotor.`
    }]);
  };

  const handleSubmit = async () => {
    if (evidences.length === 0) {
      toast({ title: "Evidência obrigatória", description: "Envie pelo menos uma foto ou prova da execução.", variant: "destructive" });
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

      toast({ title: "Visita enviada!", description: "Dados enviados para conferência administrativa." });
      navigate({ to: '/promoter' });
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/promoter">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="font-bold text-lg">Executar Visita</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-6">
        {/* Info Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-slate-800">{(visit as any).store?.name}</h2>
              <Badge variant="outline">{(visit as any).industry?.name}</Badge>
            </div>
            <p className="text-sm text-slate-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {(visit as any).store?.address}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            className="flex flex-col h-24 gap-2 border-slate-200"
            onClick={() => triggerUpload('reposicao')}
          >
            <Camera className="h-6 w-6 text-blue-600" />
            <span className="text-xs">Tirar Foto</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col h-24 gap-2 border-slate-200"
            onClick={() => triggerUpload('video')}
          >
            <Video className="h-6 w-6 text-purple-600" />
            <span className="text-xs">Gravar Vídeo</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col h-24 gap-2 border-slate-200"
            onClick={() => triggerUpload('relatorio')}
          >
            <FileText className="h-6 w-6 text-orange-600" />
            <span className="text-xs">Anexar PDF</span>
          </Button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
          accept={
            activeEvidenceType === 'reposicao' ? 'image/*' : 
            activeEvidenceType === 'video' ? 'video/*' : 
            'application/pdf,image/*'
          }
        />

        {/* Evidence List */}
        {evidences.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">Evidências Anexadas ({evidences.length})</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {evidences.map((ev, i) => (
                <div key={i} className="relative bg-slate-200 w-20 h-20 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {ev.fileType.startsWith('image/') ? (
                    <img 
                      src={supabase.storage.from('visit-evidences').getPublicUrl(ev.filePath).data.publicUrl} 
                      className="w-full h-full object-cover" 
                      alt="evidencia"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-slate-400" />
                  )}
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
          </div>
          
          {occurrences.length > 0 && (
            <div className="space-y-2 mt-2">
              {occurrences.map((oc, i) => (
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
            <>Enviar para Conferência <CheckCircle2 className="ml-2 h-5 w-5" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

// Sub-component Link used in Header
function Link({ to, children, className }: any) {
  const navigate = useNavigate();
  return (
    <a 
      href={to} 
      onClick={(e) => { e.preventDefault(); navigate({ to }); }}
      className={className}
    >
      {children}
    </a>
  );
}
