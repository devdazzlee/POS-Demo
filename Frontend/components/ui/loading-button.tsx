import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"
import type { ButtonProps } from "@/components/ui/button"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} className={cn(className)} {...props}>
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {loading ? loadingText || children : children}
    </Button>
  )
}
