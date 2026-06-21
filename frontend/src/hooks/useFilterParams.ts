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

  const page = Number(searchParams.get('page') || '1')

  function set(key: string, value: string) {
    setSearchParams(prev => {
      if (value) prev.set(key, value)
      else prev.delete(key)
      prev.delete('page') // reset to page 1 on filter change
      return prev
    }, { replace: true })
  }

  function setPage(p: number) {
    setSearchParams(prev => {
      if (p > 1) prev.set('page', String(p))
      else prev.delete('page')
      return prev
    }, { replace: true })
  }

  function clear() {
    setSearchParams({}, { replace: true })
  }

  const hasFilters = ['q', 'grade', 'class_room', 'subject_group', 'status'].some(k => searchParams.has(k))

  return { filters, page, set, setPage, clear, hasFilters }
}
