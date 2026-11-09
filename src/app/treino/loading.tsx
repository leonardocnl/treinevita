import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** The workout list while the open workout loads, once, when the workout opens. */
export default function Loading() {
    return (
        <SkeletonScreen>
            <div className="flex items-center justify-between">
                <Skeleton className="size-11 rounded-full" />
                <Skeleton className="size-11 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-9 w-40" />
            <Skeleton className="mt-2 h-5 w-56" />
            <div className="mt-6 flex flex-col gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                    <Skeleton key={index} className="h-16" />
                ))}
            </div>
        </SkeletonScreen>
    );
}
