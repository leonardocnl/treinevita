import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** Shown at once when a tab opens, while its data loads (prefetched with the link). */
export default function Loading() {
    return (
        <SkeletonScreen>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="mt-3 h-5 w-44" />
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Skeleton className="aspect-square rounded-tile" />
                <Skeleton className="aspect-square rounded-tile" />
                <Skeleton className="col-span-2 aspect-[2/1] rounded-tile" />
            </div>
        </SkeletonScreen>
    );
}
