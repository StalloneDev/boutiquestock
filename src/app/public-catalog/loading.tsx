import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b h-20 flex items-center px-4">
        <div className="max-w-7xl mx-auto w-full flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        <div className="flex gap-2 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, j) => (
                <div key={j} className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
