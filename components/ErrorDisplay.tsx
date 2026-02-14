interface ErrorDisplayProps {
  message: string;
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">✗</div>
        <p className="text-xl font-medium text-red-600 dark:text-red-400 mb-4">
          Connection Error
        </p>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-800 dark:text-red-200 font-mono">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
