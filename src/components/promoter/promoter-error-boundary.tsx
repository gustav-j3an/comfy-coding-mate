import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PromoterErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("PromoterDashboard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50 m-4">
          <CardContent className="p-8 text-center text-red-700 font-medium">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
            <p className="text-lg font-bold">Ocorreu um erro no painel</p>
            <p className="text-sm opacity-80 mt-1">
              {this.state.error?.message || "Algo deu errado ao processar os dados do painel."}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 border-red-200 text-red-700 hover:bg-red-100" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Recarregar Página
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
