import { Skeleton } from "@/components/ui/skeleton";

export const MenuSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="relative h-48 md:h-64 w-full">
        <Skeleton className="w-full h-full" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="container mx-auto flex items-center gap-4">
            <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Order Type Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>

        <div className="md:grid md:grid-cols-4 md:gap-8">
          {/* Categories Skeleton */}
          <aside className="hidden md:block md:col-span-1 sticky top-24 self-start">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
            </div>
          </aside>

          {/* Menu Items Skeleton */}
          <div className="md:col-span-3 space-y-8">
            <div>
              <Skeleton className="h-8 w-40 mb-4" />
              <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border flex flex-col md:flex-row md:items-center">
                    <Skeleton className="w-full h-40 md:w-32 md:h-32" />
                    <div className="p-4 flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border flex flex-col md:flex-row md:items-center">
                    <Skeleton className="w-full h-40 md:w-32 md:h-32" />
                    <div className="p-4 flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
