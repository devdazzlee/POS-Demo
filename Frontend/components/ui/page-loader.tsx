import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
