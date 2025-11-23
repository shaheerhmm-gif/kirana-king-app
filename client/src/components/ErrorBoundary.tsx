import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} className="text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
                        <p className="text-gray-600 mb-6">
                            We're sorry, but an unexpected error occurred. Please try reloading the page.
                        </p>
                        {this.state.error && (
                            <div className="bg-gray-100 p-3 rounded-lg text-left text-xs font-mono text-gray-700 mb-6 overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
