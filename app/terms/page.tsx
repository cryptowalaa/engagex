import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-brand-green" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Terms & <span className="text-brand-green">Conditions</span>
            </h1>
            <p className="text-gray-400">Last Updated: 3/31/2026</p>
          </div>

          {/* Content */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-8 md:p-12 space-y-8">
            
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 text-lg leading-relaxed">
                Welcome to Engagez. By accessing or using our platform, you agree to the following Terms & Conditions.
              </p>

              {/* Section 1 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">1.</span> Platform Overview
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Engagez is a Web3-based engagement platform where brands can create missions, creators can submit content, and users can interact to earn rewards.
                </p>
              </div>

              {/* Section 2 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">2.</span> No Financial Guarantee
                </h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Engagez does not guarantee:
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>Any earnings or rewards</li>
                  <li>Any return on participation</li>
                  <li>Any success of campaigns or missions</li>
                </ul>
                <p className="text-gray-400 leading-relaxed mt-4">
                  All participation is at your own risk.
                </p>
              </div>

              {/* Section 3 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">3.</span> No Liability
                </h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Engagez and its team are not responsible or liable for:
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>Any financial loss</li>
                  <li>Failed transactions</li>
                  <li>Smart contract issues</li>
                  <li>User-generated content</li>
                  <li>Brand campaign outcomes</li>
                  <li>Reward distribution delays or failures</li>
                  <li>Third-party platform issues (Twitter, Discord, wallets, etc.)</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">4.</span> User Responsibility
                </h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Users, creators, and brands are fully responsible for:
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>Their own wallet security</li>
                  <li>Submitted content</li>
                  <li>Interactions and engagement</li>
                  <li>Compliance with platform rules</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">5.</span> Payments & Transactions
                </h2>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>All payments (reward pools, verification fees, etc.) are handled via crypto wallets</li>
                  <li>Transactions are irreversible</li>
                  <li>Engagez is not responsible for incorrect transfers</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">6.</span> Mission & Rewards
                </h2>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>Brands are responsible for funding missions</li>
                  <li>Rewards are distributed based on platform logic and/or admin approval</li>
                  <li>Engagez does not guarantee reward distribution in case of issues</li>
                </ul>
              </div>

              {/* Section 7 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">7.</span> Verification System
                </h2>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>Verification badges (Blue/Yellow) are optional</li>
                  <li>Paid or free verification does not guarantee legitimacy of any brand</li>
                  <li>Engagez is not responsible for verified brand actions</li>
                </ul>
              </div>

              {/* Section 8 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">8.</span> Platform Availability
                </h2>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>Engagez may update, modify, or discontinue features at any time</li>
                  <li>No guarantee of uninterrupted access</li>
                </ul>
              </div>

              {/* Section 9 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">9.</span> Abuse & Misuse
                </h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  We reserve the right to:
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                  <li>Suspend or remove users</li>
                  <li>Reject missions or submissions</li>
                  <li>Remove rewards</li>
                </ul>
                <p className="text-gray-400 leading-relaxed mt-4">
                  In case of spam, fraud, or abuse
                </p>
              </div>

              {/* Section 10 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">10.</span> Third-Party Services
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Engagez may integrate with third-party platforms. We are not responsible for their performance, security, or policies.
                </p>
              </div>

              {/* Section 11 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                   <span className="text-brand-green">11.</span> No Warranty
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  The platform is provided &quot;as is&quot; without any warranties of any kind.
                </p>
              </div>

              {/* Section 12 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">12.</span> Changes to Terms
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Engagez may update these terms at any time. Continued use means acceptance of updated terms.
                </p>
              </div>

              {/* Section 13 */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-brand-green">13.</span> Contact
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  For any questions, contact us via <a href="https://discord.gg/2GfkVek4jV" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">Discord</a> or official channels.
                </p>
              </div>

              {/* Final */}
              <div className="mt-12 pt-8 border-t border-brand-border">
                <p className="text-gray-300 leading-relaxed text-center">
                  By using Engagez, you acknowledge that you understand and agree to these Terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
