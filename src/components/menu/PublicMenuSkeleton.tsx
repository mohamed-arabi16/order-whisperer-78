import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarInset,
} from "@/components/ui/sidebar";

const PublicMenuSkeleton = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar side="right" className="bg-card border-l">
          <SidebarHeader>
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {[...Array(5)].map((_, i) => (
                <SidebarMenuItem key={i}>
                  <div className="flex items-center gap-2 p-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 md:hidden" />
                <Skeleton className="h-6 w-24 md:hidden" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 pb-24">
            <div className="space-y-8">
              {[...Array(2)].map((_, i) => (
                <section key={i} className="space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <Card key={j} className="overflow-hidden shadow-sm h-full flex flex-col">
                        <Skeleton className="w-full h-40 object-cover" />
                        <CardContent className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PublicMenuSkeleton;
