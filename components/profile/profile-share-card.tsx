'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Download, Twitter, X, Copy, Check, Trophy } from 'lucide-react'
import { shortenAddress } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'

interface ProfileShareCardProps {
  user: {
    id: string
    username: string | null
    avatar_url: string | null
    wallet_address: string
    total_points: number
    total_earned: number
    role: string
    followers_count?: number
    following_count?: number
    submissions_count?: number
    rank?: number
    badge?: string
  } | null
  isOpen: boolean
  onClose: () => void
  type: 'creator' | 'brand'
}

export function ProfileShareCard({ user, isOpen, onClose, type }: ProfileShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const CARD_WIDTH = 1200
  const CARD_HEIGHT = 630

  useEffect(() => {
    if (isOpen && user) {
      generateCard()
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  function getBadge(rank: number) {
    if (rank === 1) return { text: '🏆 OG Creator', color: '#FFD700' }
    if (rank <= 3) return { text: '👑 Top Creator', color: '#FFD700' }
    if (rank <= 10) return { text: '⭐ Rising Star', color: '#FFA500' }
    if (rank <= 50) return { text: '🚀 Active', color: '#00FFE0' }
    return { text: '✨ Early Adopter', color: '#9b59b6' }
  }

  async function generateCard() {
    setIsGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    bgGrad.addColorStop(0, '#0c0c14')
    bgGrad.addColorStop(0.5, '#151520')
    bgGrad.addColorStop(1, '#0a0a10')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Glows
    const glow1 = ctx.createRadialGradient(240, 252, 0, 240, 252, 400)
    glow1.addColorStop(0, 'rgba(0,255,224,0.15)')
    glow1.addColorStop(1, 'rgba(0,255,224,0)')
    ctx.fillStyle = glow1
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    const glow2 = ctx.createRadialGradient(960, 378, 0, 960, 378, 300)
    glow2.addColorStop(0, 'rgba(255,46,99,0.1)')
    glow2.addColorStop(1, 'rgba(255,46,99,0)')
    ctx.fillStyle = glow2
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let i = 0; i < CARD_WIDTH; i += 60) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, CARD_HEIGHT)
      ctx.stroke()
    }
    for (let i = 0; i < CARD_HEIGHT; i += 60) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(CARD_WIDTH, i)
      ctx.stroke()
    }

    // Top bar
    const topBarGrad = ctx.createLinearGradient(0, 0, 0, 80)
    topBarGrad.addColorStop(0, 'rgba(0,255,224,0.05)')
    topBarGrad.addColorStop(1, 'rgba(0,255,224,0)')
    ctx.fillStyle = topBarGrad
    ctx.fillRect(0, 0, CARD_WIDTH, 80)
    
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 80)
    ctx.lineTo(CARD_WIDTH, 80)
    ctx.stroke()

    // Brand Icon
    const iconX = 60
    const iconY = 18
    const iconSize = 44
    
    ctx.shadowColor = 'rgba(0,255,224,0.4)'
    ctx.shadowBlur = 30
    const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize)
    iconGrad.addColorStop(0, '#00FFE0')
    iconGrad.addColorStop(1, '#FF2E63')
    ctx.fillStyle = iconGrad
    roundRect(ctx, iconX, iconY, iconSize, iconSize, 12)
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#000'
    ctx.font = '900 24px Inter, system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('E', iconX + iconSize/2, iconY + iconSize/2 + 2)

    // Brand Text
    ctx.fillStyle = '#fff'
    ctx.font = '800 28px Inter, system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('Engage', iconX + iconSize + 16, 52)
    
    const textWidth = ctx.measureText('Engage').width
    ctx.fillStyle = '#00FFE0'
    ctx.fillText('Z', iconX + iconSize + 16 + textWidth, 52)

    // Network Badge
    const badgeX = CARD_WIDTH - 60
    const badgeY = 18
    const badgeW = 120
    const badgeH = 40
    
    const roleColor = type === 'creator' ? '#00FFE0' : '#FF2E63'
    ctx.fillStyle = roleColor + '15'
    roundRect(ctx, badgeX - badgeW, badgeY, badgeW, badgeH, 20)
    ctx.fill()
    
    ctx.strokeStyle = roleColor + '30'
    ctx.lineWidth = 1
    roundRect(ctx, badgeX - badgeW, badgeY, badgeW, badgeH, 20)
    ctx.stroke()
    
    ctx.fillStyle = roleColor
    ctx.font = '600 13px Inter, system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`● ${type === 'creator' ? 'CREATOR' : 'BRAND'}`, badgeX - badgeW/2, badgeY + badgeH/2 + 1)

    // Corner Accents
    ctx.strokeStyle = 'rgba(0,255,224,0.1)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(CARD_WIDTH - 60, 100)
    ctx.lineTo(CARD_WIDTH - 60, 180)
    ctx.lineTo(CARD_WIDTH - 140, 180)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(60, CARD_HEIGHT - 100)
    ctx.lineTo(60, CARD_HEIGHT - 180)
    ctx.lineTo(140, CARD_HEIGHT - 180)
    ctx.stroke()

    // Avatar
    const avatarX = 110
    const avatarY = 170
    const avatarSize = 200

    ctx.shadowColor = 'rgba(0,255,224,0.4)'
    ctx.shadowBlur = 40
    const glowGrad = ctx.createRadialGradient(
      avatarX + avatarSize/2, avatarY + avatarSize/2, 0,
      avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 20
    )
    glowGrad.addColorStop(0, 'rgba(0,255,224,0.3)')
    glowGrad.addColorStop(0.5, 'rgba(255,46,99,0.2)')
    glowGrad.addColorStop(1, 'rgba(0,255,224,0)')
    ctx.fillStyle = glowGrad
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    const ringGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize)
    ringGrad.addColorStop(0, '#00FFE0')
    ringGrad.addColorStop(0.5, '#FF2E63')
    ringGrad.addColorStop(1, '#00FFE0')
    ctx.fillStyle = ringGrad
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 - 4, 0, Math.PI * 2)
    ctx.fillStyle = '#0a0a12'
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = '800 80px Inter, system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const initial = user.username?.[0]?.toUpperCase() || 'C'
    ctx.fillText(initial, avatarX + avatarSize/2, avatarY + avatarSize/2)

    if (user.avatar_url) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = user.avatar_url!
        })
        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 - 4, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, avatarX + 4, avatarY + 4, avatarSize - 8, avatarSize - 8)
        ctx.restore()
      } catch (e) {}
    }

    // Rank pill
    const rankX = avatarX + avatarSize/2
    const rankY = avatarY + avatarSize + 5
    const rankW = 80
    const rankH = 36
    
    ctx.shadowColor = 'rgba(255,215,0,0.5)'
    ctx.shadowBlur = 20
    const rankGrad = ctx.createLinearGradient(rankX - rankW/2, rankY, rankX + rankW/2, rankY + rankH)
    rankGrad.addColorStop(0, '#FFD700')
    rankGrad.addColorStop(1, '#FFA500')
    ctx.fillStyle = rankGrad
    roundRect(ctx, rankX - rankW/2, rankY, rankW, rankH, 18)
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.fillStyle = '#000'
    ctx.font = '800 18px Inter, system-ui'
    ctx.fillText(`#${user.rank || 1}`, rankX, rankY + rankH/2 + 2)

    // Info Section
    const infoX = 360
    const infoY = 170

    ctx.fillStyle = '#fff'
    ctx.font = '900 64px Inter, system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(user.username || 'Anonymous', infoX, infoY + 50)

    ctx.fillStyle = '#00FFE0'
    ctx.font = '18px SF Mono, monospace'
    ctx.fillText(shortenAddress(user.wallet_address, 12), infoX + 20, infoY + 85)
    
    ctx.fillStyle = '#00FFE0'
    ctx.shadowColor = '#00FFE0'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(infoX + 6, infoY + 80, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Achievement badge
    const ach = getBadge(user.rank || 1)
    const achY = infoY + 115
    const achW = 220
    const achH = 52
    
    ctx.shadowColor = ach.color
    ctx.shadowBlur = 25
    ctx.fillStyle = ach.color + '15'
    roundRect(ctx, infoX, achY, achW, achH, 26)
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.strokeStyle = ach.color + '40'
    ctx.lineWidth = 1.5
    roundRect(ctx, infoX, achY, achW, achH, 26)
    ctx.stroke()
    
    ctx.font = '28px system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(ach.text.split(' ')[0], infoX + 20, achY + achH/2 + 2)
    
    ctx.fillStyle = ach.color
    ctx.font = '700 18px Inter, system-ui'
    ctx.fillText(ach.text.split(' ').slice(1).join(' '), infoX + 55, achY + achH/2 + 2)

    // Stats Grid
    const statsY = 420
    const stats = type === 'creator' 
      ? [
          { label: 'POINTS', value: (user.total_points || 0).toLocaleString(), sub: 'XP Earned', color: '#00FFE0' },
          { label: 'FOLLOWERS', value: (user.followers_count || 0).toLocaleString(), sub: 'Community', color: '#FF2E63' },
          { label: 'EARNED', value: (user.total_earned || 0) + ' USDC', sub: 'Rewards', color: '#FFD700' },
          { label: 'WORK', value: (user.submissions_count || 0).toString(), sub: 'Submissions', color: '#9b59b6' }
        ]
      : [
          { label: 'CAMPAIGNS', value: (user.submissions_count || 0).toLocaleString(), sub: 'Launched', color: '#00FFE0' },
          { label: 'ENGAGEMENT', value: (user.total_points || 0).toLocaleString(), sub: 'Reach', color: '#FF2E63' },
          { label: 'CREATORS', value: (user.followers_count || 0).toLocaleString(), sub: 'Partners', color: '#9b59b6' },
          { label: 'INVESTED', value: (user.total_earned || 0) + ' USDC', sub: 'Spent', color: '#FFD700' }
        ]

    const statW = 240
    const statGap = 20
    const startX = 60

    stats.forEach((stat, i) => {
      const x = startX + (i * (statW + statGap))
      
      const cardGrad = ctx.createLinearGradient(x, statsY, x, statsY + 120)
      cardGrad.addColorStop(0, 'rgba(255,255,255,0.08)')
      cardGrad.addColorStop(1, 'rgba(255,255,255,0.02)')
      ctx.fillStyle = cardGrad
      roundRect(ctx, x, statsY, statW, 120, 20)
      ctx.fill()
      
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      roundRect(ctx, x, statsY, statW, 120, 20)
      ctx.stroke()
      
      ctx.fillStyle = stat.color
      ctx.shadowColor = stat.color
      ctx.shadowBlur = 20
      ctx.fillRect(x, statsY, statW, 3)
      ctx.shadowBlur = 0
      
      ctx.fillStyle = '#888899'
      ctx.font = '600 11px Inter, system-ui'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(stat.label, x + 24, statsY + 35)
      
      ctx.fillStyle = '#fff'
      ctx.font = '800 36px Inter, system-ui'
      ctx.fillText(stat.value, x + 24, statsY + 80)
      
      ctx.fillStyle = '#666677'
      ctx.font = '13px Inter, system-ui'
      ctx.fillText(stat.sub, x + 24, statsY + 105)
    })

    // Bottom Bar
    const bottomY = CARD_HEIGHT - 40
    
    const bottomGrad = ctx.createLinearGradient(0, CARD_HEIGHT - 80, 0, CARD_HEIGHT)
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)')
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = bottomGrad
    ctx.fillRect(0, CARD_HEIGHT - 80, CARD_WIDTH, 80)
    
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, CARD_HEIGHT - 80)
    ctx.lineTo(CARD_WIDTH - 60, CARD_HEIGHT - 80)
    ctx.stroke()

    ctx.fillStyle = '#666677'
    ctx.font = '16px Inter, system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const tagline = type === 'creator' 
      ? 'Earning from real engagement on '
      : 'Driving real engagement with creators on '
    ctx.fillText(tagline, 60, bottomY)

    const tagW = ctx.measureText(tagline).width
    ctx.fillStyle = '#00FFE0'
    ctx.font = '600 16px Inter, system-ui'
    ctx.fillText('Engagez', 60 + tagW, bottomY)

    ctx.fillStyle = '#fff'
    ctx.font = '600 16px Inter, system-ui'
    ctx.textAlign = 'right'
    ctx.fillText('engagez.xyz', CARD_WIDTH - 96, bottomY)
    
    const arrowX = CARD_WIDTH - 60 - 36
    const arrowGrad = ctx.createLinearGradient(arrowX, bottomY - 18, arrowX + 36, bottomY + 18)
    arrowGrad.addColorStop(0, '#00FFE0')
    arrowGrad.addColorStop(1, '#00d4b8')
    ctx.fillStyle = arrowGrad
    roundRect(ctx, arrowX, bottomY - 18, 36, 36, 10)
    ctx.fill()
    
    ctx.fillStyle = '#000'
    ctx.font = '800 18px Inter, system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('→', arrowX + 18, bottomY + 2)

    const dataUrl = canvas.toDataURL('image/png', 1.0)
    setGeneratedImage(dataUrl)
    setIsGenerating(false)
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function downloadCard() {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.download = `engagez-${user?.username || 'profile'}.png`
    link.href = generatedImage
    link.click()
    toast.success('Card downloaded!')
  }

  async function shareOnTwitter() {
    if (!generatedImage) return
    const rank = user?.rank || 1
    const text = `I'm ranked #${rank} on @Engagez_ 🏆\n\n${type === 'creator' ? 'Earning from real engagement' : 'Driving real engagement with creators'}\n\nJoin me 👇`
    
    const response = await fetch(generatedImage)
    const blob = await response.blob()
    const file = new File([blob], 'engagez-card.png', { type: 'image/png' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My EngageZ Profile', text })
        return
      } catch (err) {}
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://engagez.xyz')}`
    window.open(twitterUrl, '_blank')
    
    const link = document.createElement('a')
    link.download = `engagez-card-${user?.username || 'profile'}.png`
    link.href = generatedImage
    link.click()
    
    toast.success('Twitter opened! Image downloaded - attach it to your tweet', { duration: 5000 })
  }

  function copyReferralLink() {
    const link = `https://engagez.xyz?ref=${user?.wallet_address?.slice(0, 8) || 'user'}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      <div className="relative bg-[#0a0a12] border border-[#00FFE0]/20 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-8 border-b border-[#00FFE0]/10 bg-gradient-to-r from-[#00FFE0]/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00FFE0] to-[#FF2E63] flex items-center justify-center">
              <Share2 className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Share Your Profile</h2>
              <p className="text-gray-400 text-sm">Generate a premium shareable card</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[#12121a] border border-[#00FFE0]/30 flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <canvas ref={canvasRef} width={CARD_WIDTH} height={CARD_HEIGHT} className="hidden" />
          <div className="relative rounded-2xl overflow-hidden border border-[#00FFE0]/20 shadow-2xl">
            {isGenerating ? (
              <div className="aspect-[1200/630] bg-[#0a0a12] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-2 border-[#00FFE0]/20 border-t-[#00FFE0] rounded-full animate-spin" />
                  <p className="text-[#00FFE0] font-medium">Generating premium card...</p>
                </div>
              </div>
            ) : generatedImage ? (
              <img src={generatedImage} alt="Profile Card" className="w-full h-auto" />
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={shareOnTwitter} disabled={!generatedImage || isGenerating}
              className="flex items-center justify-center gap-3 py-5 bg-[#1DA1F2] text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-[#1DA1F2]/25 transition-all disabled:opacity-50">
              <Twitter size={22} />
              <span>Share on Twitter</span>
            </button>
            <button onClick={downloadCard} disabled={!generatedImage || isGenerating}
              className="flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-[#00FFE0] to-[#00d4b8] text-[#0a0a12] font-bold rounded-2xl hover:shadow-lg hover:shadow-[#00FFE0]/25 transition-all disabled:opacity-50">
              <Download size={22} />
              <span>Download Card</span>
            </button>
            <button onClick={copyReferralLink}
              className="flex items-center justify-center gap-3 py-5 bg-[#12121a] border-2 border-[#FF2E63]/50 text-[#FF2E63] font-bold rounded-2xl hover:bg-[#FF2E63]/10 transition-all">
              {copied ? <Check size={22} /> : <Copy size={22} />}
              <span>{copied ? 'Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>

          <div className="bg-[#12121a] rounded-2xl p-6 border border-[#00FFE0]/10">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-[#FFD700]" />
              Card Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a0a12] to-[#12121a] border border-[#00FFE0]/20">
                <p className="text-[#00FFE0] font-black text-2xl">#{user?.rank || 1}</p>
                <p className="text-gray-500 text-xs uppercase">Rank</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a0a12] to-[#12121a] border border-[#00FFE0]/20">
                <p className="text-white font-black text-2xl">{(user?.total_points || 0).toLocaleString()}</p>
                <p className="text-gray-500 text-xs uppercase">Points</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a0a12] to-[#12121a] border border-[#FF2E63]/20">
                <p className="text-[#FF2E63] font-black text-2xl">{(user?.followers_count || 0).toLocaleString()}</p>
                <p className="text-gray-500 text-xs uppercase">Followers</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a0a12] to-[#12121a] border border-[#9b59b6]/20">
                <p className="text-[#9b59b6] font-black text-2xl">{(user?.submissions_count || 0).toLocaleString()}</p>
                <p className="text-gray-500 text-xs uppercase">Submissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
