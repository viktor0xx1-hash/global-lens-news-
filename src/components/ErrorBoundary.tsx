import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-bbc-red" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-bbc-dark mb-4">Connection Interrupted</h1>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              We're having trouble connecting to the Global Lens network. This could be due to a slow connection or a temporary server issue.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-bbc-dark text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reconnect Now
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-gray-100 rounded text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-gray-500 break-all">
                  {this.state.error?.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
