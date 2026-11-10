import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** The onboarding while the catalog and the current plan load. */
export default function Loading() {
    return (
        <SkeletonScreen>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="mt-block h-10 w-3/4" />
            <Skeleton className="mt-label h-5 w-1/2" />
            <div className="mt-block flex flex-col gap-inner">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
            </div>
        </SkeletonScreen>
    );
}
