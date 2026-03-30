'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { useUser } from '@/hooks/use-user'
import { Building2, Globe, Twitter, Linkedin, MessageCircle, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ApplyAsBrandPage() {
  const { user, applyAsBrand, isBrandPending, isBrand } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    website_url: '',
    twitter_handle: '',
    discord_handle: '',
    linkedin_url: '',
    telegram_handle: '',
    bio: ''
  })

  // Redirect if already brand or pending
  if (isBrand) {
    router.push('/brand')
    return null
  }
  if (isBrandPending) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Navbar />
        <div className="flex pt-16">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
              <p className="text-gray-400 mb-6">Your brand application is under review. You will be notified once approved.</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-brand-green text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all"
              >
                Go to Home
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation: Website and Twitter are required
    if (!formData.website_url || !formData.twitter_handle) {
      toast.error('Website and Twitter are required!')
      return
    }

    setLoading(true)
    const result = await applyAsBrand(formData)
    setLoading(false)

    if (result.success) {
      toast.success('Application submitted successfully!')
    } else {
      toast.error(result.error || 'Failed to submit application')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">
                Apply as <span className="text-brand-purple">Brand</span>
              </h1>
              <p className="text-gray-400">Submit your application to create missions on EngageX</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-6">
              {/* Required Fields */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={20} className="text-brand-green" />
                  <h3 className="text-white font-semibold">Required Information</h3>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Website URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourbrand.com"
                    value={formData.website_url}
                    onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Twitter/X Handle <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@yourbrand"
                    value={formData.twitter_handle}
                    onChange={(e) => setFormData({...formData, twitter_handle: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-6 border-t border-brand-border">
                <div className="flex items-center gap-2 mb-4">
                  <Send size={20} className="text-brand-purple" />
                  <h3 className="text-white font-semibold">Social Links (Optional)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Discord</label>
                    <input
                      type="text"
                      placeholder="username#0000"
                      value={formData.discord_handle}
                      onChange={(e) => setFormData({...formData, discord_handle: e.target.value})}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">LinkedIn</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/company/..."
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Telegram</label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={formData.telegram_handle}
                      onChange={(e) => setFormData({...formData, telegram_handle: e.target.value})}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="pt-6 border-t border-brand-border">
                <label className="block text-sm text-gray-400 mb-2">Brand Description</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your brand..."
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-green/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green text-brand-dark font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Building2 size={20} />
                    Submit Application
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Our team will review your application within 24-48 hours.
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
