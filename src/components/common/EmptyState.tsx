import React, { ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { FolderSearch, AlertOctagon, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className,
}) => {
  return (
    <Card variant="flat" className={cn('text-center py-12 px-6 flex flex-col items-center justify-center border-dashed border-slate-300 bg-slate-50/60', className)}>
      <div className="p-4 rounded-2xl bg-white text-slate-500 mb-4 border border-slate-200 shadow-sm">
        {icon || <FolderSearch className="w-8 h-8 text-indigo-600" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Card>
  );
};

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Veriler yükleniyor...',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center space-y-3', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  message = 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.',
  onRetry,
  className,
}) => {
  return (
    <Card variant="flat" className={cn('text-center py-10 px-6 border-rose-200 bg-rose-50/50', className)}>
      <div className="inline-flex p-3 rounded-xl bg-rose-100 text-rose-600 mb-3 border border-rose-200">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-900">Bir Hata Oluştu</h4>
      <p className="text-xs text-rose-700/80 max-w-md mx-auto mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-rose-300 text-rose-700 hover:bg-rose-100">
          Tekrar Dene
        </Button>
      )}
    </Card>
  );
};

