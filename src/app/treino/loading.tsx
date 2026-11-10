import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

/** The set screen dimmed, while the open workout loads once. */
export default function Loading() {
    return (
        <SkeletonScreen>
            <div className="flex h-10 items-center justify-between">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
            </div>
            <Skeleton className="mt-intro h-1" />
            <Skeleton className="mt-block h-3 w-32" />
            <Skeleton className="mt-inner h-8 w-3/4" />
            <Skeleton className="mt-intro h-[152px]" />
            <Skeleton className="mt-block h-[216px]" />
        </SkeletonScreen>
    );
}
