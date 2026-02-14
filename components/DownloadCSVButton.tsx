import { exportToCSV } from "@/lib/csv-export";

interface DownloadCSVButtonProps {
  data: any[];
  filename: string;
  disabled?: boolean;
}

export default function DownloadCSVButton({
  data,
  filename,
  disabled = false,
}: DownloadCSVButtonProps) {
  const handleDownload = () => {
    exportToCSV(data, filename);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !data || data.length === 0}
      className="px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      Download CSV
    </button>
  );
}
