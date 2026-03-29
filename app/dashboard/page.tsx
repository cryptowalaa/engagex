'use client'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
export default function DashboardRedirect() {
  useEffect(() => { window.location.href = '/user' }, [])
  return <div className="min-h-screen bg-brand-dark flex items-center justify-center"><p className="text-gray-400">Redirecting...</p></div>
}
