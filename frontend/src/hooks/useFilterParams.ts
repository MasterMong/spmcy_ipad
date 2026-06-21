import { useSearchParams } from 'react-router-dom'
import type { Filters, AssignmentStatus } from '../types'

export function useFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: Filters = {
    q: searchParams.get('q') || undefined,
    grade: searchParams.get('grade') ? Number(searchParams.get('grade')) : undefined,
    class_room: searchParams.get('class_room') || undefined,
    subject_group: searchParams.get('subject_group') || undefined,
    status: (searchParams.get('status') as AssignmentStatus) || undefined,
  }

  function set(key: string, value: string) {
    setSearchParams(prev => {
      if (value) prev.set(key, value)
      else prev.delete(key)
      return prev
    }, { replace: true })
  }

  function clear() {
    setSearchParams({}, { replace: true })
  }

  const hasFilters = [...searchParams.values()].some(Boolean)

  return { filters, set, clear, hasFilters }
}
