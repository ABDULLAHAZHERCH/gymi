import ProtectedRoute from '@/components/providers/ProtectedRoute';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
