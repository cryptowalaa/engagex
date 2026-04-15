'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Share2, Download, Twitter, X, Copy, Check, 
  Trophy
} from 'lucide-react'
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

  async function generateCard() {
    setIsGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    gradient.addColorStop(0, '#0a0a0f')
    gradient.addColorStop(0.5, '#12121a')
    gradient.addColorStop(1, '#0f0f16')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    ctx.strokeStyle = 'rgba(0, 255, 224, 0.03)'
    ctx.lineWidth = 1
    for (let i = 0; i < CARD_WIDTH; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, CARD_HEIGHT)
      ctx.stroke()
    }
    for (let i = 0; i < CARD_HEIGHT; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(CARD_WIDTH, i)
      ctx.stroke()
    }

    const glow1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 400)
    glow1.addColorStop(0, 'rgba(0, 255, 224, 0.15)')
    glow1.addColorStop(1, 'rgba(0, 255, 224, 0)')
    ctx.fillStyle = glow1
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    const glow2 = ctx.createRadialGradient(CARD_WIDTH - 200, CARD_HEIGHT - 200, 0, CARD_WIDTH - 200, CARD_HEIGHT - 200, 400)
    glow2.addColorStop(0, 'rgba(255, 46, 99, 0.1)')
    glow2.addColorStop(1, 'rgba(255, 46, 99, 0)')
    ctx.fillStyle = glow2
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.strokeStyle = 'rgba(0, 255, 224, 0.2)'
    ctx.lineWidth = 2
    
    roundRect(ctx, 60, 60, CARD_WIDTH - 120, CARD_HEIGHT - 120, 24)
    ctx.fill()
    ctx.stroke()

    ctx.shadowColor = '#00FFE0'
    ctx.shadowBlur = 30
    ctx.strokeStyle = 'rgba(0, 255, 224, 0.4)'
    ctx.lineWidth = 1
    roundRect(ctx, 60, 60, CARD_WIDTH - 120, CARD_HEIGHT - 120, 24)
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#00FFE0'
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('ENGAGEZ', CARD_WIDTH - 100, 110)

    const logoGradient = ctx.createLinearGradient(CARD_WIDTH - 250, 0, CARD_WIDTH - 100, 0)
    logoGradient.addColorStop(0, 'rgba(0, 255, 224, 0)')
    logoGradient.addColorStop(0.5, '#00FFE0')
    logoGradient.addColorStop(1, 'rgba(0, 255, 224, 0)')
    ctx.strokeStyle = logoGradient
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(CARD_WIDTH - 250, 120)
    ctx.lineTo(CARD_WIDTH - 100, 120)
    ctx.stroke()

    const avatarX = 140
    const avatarY = 180
    const avatarSize = 140

    ctx.shadowColor = '#FF2E63'
    ctx.shadowBlur = 40
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 10, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 46, 99, 0.3)'
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
    
    const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize)
    avatarGrad.addColorStop(0, '#00FFE0')
    avatarGrad.addColorStop(1, '#FF2E63')
    ctx.fillStyle = avatarGrad
    ctx.fill()

    ctx.fillStyle = '#0a0a0f'
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif'
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
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
        ctx.restore()
      } catch (e) {
        // Keep placeholder
      }
    }

    ctx.strokeStyle = '#00FFE0'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2)
    ctx.stroke()

    const textX = 320
    const textY = 200

    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
    ctx.fillText(user.username || 'Anonymous', textX, textY)

    ctx.fillStyle = '#00FFE0'
    ctx.font = '24px monospace'
    ctx.fillText(shortenAddress(user.wallet_address, 8), textX, textY + 40)

    const badgeText = type === 'creator' ? 'CREATOR' : 'BRAND'
    const badgeColor = type === 'creator' ? '#00FFE0' : '#FF2E63'
    
    ctx.fillStyle = badgeColor + '20'
    roundRect(ctx, textX, textY + 60, 120, 36, 18)
    ctx.fill()
    
    ctx.fillStyle = badgeColor
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(badgeText, textX + 60, textY + 83)

    const statsY = 360
    const statSpacing = 200
    const startX = 140

    const stats = type === 'creator' 
      ? [
          { label: 'RANK', value: '#' + (user.rank || 1), icon: '🏆', color: '#FFD700' },
          { label: 'POINTS', value: (user.total_points?.toLocaleString() || '0'), icon: '⚡', color: '#00FFE0' },
          { label: 'FOLLOWERS', value: (user.followers_count?.toLocaleString() || '0'), icon: '👥', color: '#FF2E63' },
          { label: 'SUBMISSIONS', value: (user.submissions_count?.toLocaleString() || '0'), icon: '📝', color: '#9b59b6' }
        ]
      : [
          { label: 'CAMPAIGNS', value: (user.submissions_count?.toLocaleString() || '0'), icon: '🚀', color: '#00FFE0' },
          { label: 'ENGAGEMENT', value: (user.total_points?.toLocaleString() || '0'), icon: '💎', color: '#FF2E63' },
          { label: 'CREATORS', value: (user.followers_count?.toLocaleString() || '0'), icon: '🎨', color: '#9b59b6' },
          { label: 'EARNED', value: (user.total_earned || 0) + ' USDC', icon: '💰', color: '#FFD700' }
        ]

    stats.forEach((stat, index) => {
      const x = startX + (index * statSpacing)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      roundRect(ctx, x, statsY, 160, 100, 16)
      ctx.fill()
      
      ctx.strokeStyle = stat.color + '40'
      ctx.lineWidth = 1
      roundRect(ctx, x, statsY, 160, 100, 16)
      ctx.stroke()

      ctx.font = '32px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(stat.icon, x + 80, statsY + 40)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
      ctx.fillText(stat.value, x + 80, statsY + 70)

      ctx.fillStyle = '#888899'
      ctx.font = '12px system-ui, -apple-system, sans-serif'
      ctx.fillText(stat.label, x + 80, statsY + 90)
    })

    if (user.badge) {
      const badgeY = 500
      const badgeX = CARD_WIDTH / 2
      
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 20
      
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'
      roundRect(ctx, badgeX - 150, badgeY - 20, 300, 44, 22)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 2
      roundRect(ctx, badgeX - 150, badgeY - 20, 300, 44, 22)
      ctx.stroke()

      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('★ ' + user.badge + ' ★', badgeX, badgeY + 8)
    }

    const tagline = type === 'creator'
      ? 'Earning from real engagement on Engagez'
      : 'Driving real engagement with creators'
    
    ctx.fillStyle = '#888899'
    ctx.font = '20px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(tagline, CARD_WIDTH / 2, CARD_HEIGHT - 140)

    ctx.fillStyle = '#00FFE0'
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
    ctx.fillText('Join me on Engagez → engagez.xyz', CARD_WIDTH / 2, CARD_HEIGHT - 100)

    const dataUrl = canvas.toDataURL('image/png', 1.0)
    setGeneratedImage(dataUrl)
    setIsGenerating(false)
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  function downloadCard() {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.download = 'engagez-profile-' + (user?.username || 'card') + '.png'
    link.href = generatedImage
    link.click()
    
    toast.success('Card downloaded!')
  }

  function shareOnTwitter() {
    const rank = user?.rank || 1
    const text = "I'm ranked #" + rank + " on Engagez 🚀\n\nEarning from real engagement.\n\nJoin me → engagez.xyz"
    
    const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text)
    window.open(url, '_blank')
    
    toast.success('Opening Twitter...')
  }

  function copyReferralLink() {
    const link = 'https://engagez.xyz?ref=' + (user?.wallet_address?.slice(0, 8) || 'user')
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative bg-[#0a0a0f] border border-[#00FFE0]/30 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#00FFE0]/20">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Share2 className="text-[#00FFE0]" size={28} />
              Share Your Profile
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Generate a shareable card for Twitter
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#12121a] border border-[#00FFE0]/30 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#00FFE0] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <canvas 
            ref={canvasRef}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            className="hidden"
          />

          <div className="relative rounded-2xl overflow-hidden border border-[#00FFE0]/20 shadow-2xl shadow-[#00FFE0]/10">
            {isGenerating ? (
              <div className="aspect-[1200/630] bg-[#12121a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[#00FFE0] font-medium">Generating your card...</p>
                </div>
              </div>
            ) : generatedImage ? (
              <img 
                src={generatedImage} 
                alt="Profile Card" 
                className="w-full h-auto"
              />
            ) : null}
            
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#00FFE0]/5 via-transparent to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={shareOnTwitter}
              disabled={!generatedImage || isGenerating}
              className="flex items-center justify-center gap-2 py-4 bg-[#1DA1F2] text-white font-bold rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Twitter size={20} />
              Share on Twitter
            </button>
            
            <button
              onClick={downloadCard}
              disabled={!generatedImage || isGenerating}
              className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#00FFE0] to-[#00FFE0]/80 text-[#0a0a0f] font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Download Card
            </button>
            
            <button
              onClick={copyReferralLink}
              className="flex items-center justify-center gap-2 py-4 bg-[#12121a] border border-[#FF2E63]/50 text-[#FF2E63] font-bold rounded-xl hover:bg-[#FF2E63]/10 transition-all"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? 'Copied!' : 'Copy Referral Link'}
            </button>
          </div>

          <div className="bg-[#12121a] rounded-2xl p-4 border border-[#00FFE0]/10">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-[#FFD700]" />
              Card Stats Preview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-xl bg-[#0a0a0f] border border-[#00FFE0]/20">
                <p className="text-[#00FFE0] font-black text-lg">#{user?.rank || 1}</p>
                <p className="text-gray-500 text-xs">Rank</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0a0a0f] border border-[#00FFE0]/20">
                <p className="text-white font-black text-lg">{user?.total_points?.toLocaleString() || 0}</p>
                <p className="text-gray-500 text-xs">Points</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0a0a0f] border border-[#FF2E63]/20">
                <p className="text-[#FF2E63] font-black text-lg">{user?.followers_count?.toLocaleString() || 0}</p>
                <p className="text-gray-500 text-xs">Followers</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0a0a0f] border border-[#9b59b6]/20">
                <p className="text-[#9b59b6] font-black text-lg">{user?.submissions_count?.toLocaleString() || 0}</p>
                <p className="text-gray-500 text-xs">Submissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
