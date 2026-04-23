import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Readonly<Props>;
  public state: State;
  public setState: React.Component<Props, State>['setState'];

  public constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-red-100">
            <h2 className="text-xl font-bold text-red-600 mb-4">Terjadi Kesalahan Aplikasi</h2>
            <div className="bg-slate-50 p-4 rounded-lg overflow-auto max-h-60 mb-4">
                <p className="font-mono text-xs text-red-500 whitespace-pre-wrap">
                    {this.state.error?.toString()}
                </p>
                {this.state.errorInfo && (
                    <pre className="font-mono text-[10px] text-slate-500 mt-2">
                        {this.state.errorInfo.componentStack}
                    </pre>
                )}
            </div>
            <button
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
                Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
