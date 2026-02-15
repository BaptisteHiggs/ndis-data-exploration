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
      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-md font-medium shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      Download CSV
    </button>
  );
}
