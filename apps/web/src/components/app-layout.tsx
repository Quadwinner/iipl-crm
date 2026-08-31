import { Outlet } from 'react-router-dom'
import { SuperappBar } from '@/components/superapp-bar'

/**
 * Wraps every signed-in surface. The module's own shell renders inside the
 * Outlet, directly beneath this bar.
 */
export function AppLayout() {
  return (
    <div className="min-h-svh">
      <SuperappBar />
      <Outlet />
    </div>
  )
}
