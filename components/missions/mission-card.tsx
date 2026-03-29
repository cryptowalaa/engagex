import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import type { Mission } from '@/types/database'
import { timeUntil } from '@/lib/utils/helpers'

const statusColors: Record<string, string> = {
  active: 'bg-brand-green/10 text-brand-green border border-brand-green/20',
  funded: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  draft: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  completed: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

export function MissionCard({ mission }: { mission: Mission }) {
  return (
    <Link href={`/missions/${mission.id}`}>
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 h-full card-hover shimmer flex flex-col cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[mission.status]}`}>{mission.status}</span>
          <span className="font-black text-brand-green text-lg">{mission.reward_pool} {mission.currency}</span>
        </div>
        <h3 className="font-bold text-white text-base mb-2 line-clamp-2">{mission.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">{mission.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-brand-border">
          <span className="flex items-center gap-1"><Clock size={11} />{timeUntil(mission.deadline)} left</span>
          <span className="flex items-center gap-1"><Users size={11} />{mission.max_winners} winners</span>
        </div>
      </div>
    </Link>
  )
}
