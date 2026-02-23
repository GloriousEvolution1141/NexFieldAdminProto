export function AuthButtonSkeleton() {
    return (
        <div className="flex items-center gap-4 animate-pulse">
            <div className="h-9 w-40 bg-gray-200 rounded-md" />
            <div className="h-9 w-20 bg-gray-200 rounded-md" />
        </div>
    );
}