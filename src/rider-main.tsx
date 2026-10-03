import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeliveryProvider } from './context/DeliveryContext';
import { RiderPortal } from './components/rider/RiderPortal';
import { Bike, RefreshCw } from 'lucide-react';
import './index.css';

class RiderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Rider App Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-4 border border-rose-100">
            <Bike className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Rider App Recovered</h2>
          <p className="text-xs text-slate-600 max-w-sm mb-4">
            {this.state.error?.message || 'An error occurred during rider session setup.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs flex items-center space-x-2 cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Rider App</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const StandaloneRiderApp: React.FC = () => {
  return (
    <RiderErrorBoundary>
      <DeliveryProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <main className="flex-1">
            <RiderPortal />
          </main>
        </div>
      </DeliveryProvider>
    </RiderErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(<StandaloneRiderApp />);
