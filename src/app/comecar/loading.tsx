import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** The onboarding while the catalog and the current plan load. */
export default function Loading() {
    return (
        <SkeletonScreen>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="mt-10 h-10 w-3/4" />
            <Skeleton className="mt-3 h-5 w-1/2" />
            <div className="mt-8 flex flex-col gap-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
            </div>
        </SkeletonScreen>
    );
}
