import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** The home dimmed (top bar, hero, first widgets) while a tab's data loads. No shimmer. */
export default function Loading() {
    return (
        <SkeletonScreen>
            <div className="flex h-10 items-center justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="size-10 rounded-full" />
            </div>
            <Skeleton className="mt-intro h-3 w-48" />
            <Skeleton className="mt-inner h-14 w-3/4" />
            <Skeleton className="mt-inner h-4 w-56" />
            <Skeleton className="mt-block h-16 rounded-cta" />
            <div className="mt-section grid grid-cols-2 gap-gutter">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
        </SkeletonScreen>
    );
}
