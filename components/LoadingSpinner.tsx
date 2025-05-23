import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="w-full h-32 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
    </div>
  );
} 