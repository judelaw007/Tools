import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ToolCard } from '@/components/tools/ToolCard';
import {
  Calculator,
  Search,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Wrench,
  ArrowRight,
  ExternalLink,
  Clock,
  Star,
} from 'lucide-react';
import type { Tool } from '@/types';

// Mock data - will be replaced with real queries
const userTools: Tool[] = [
  {
    id: 'tp-margin-calculator',
    name: 'TP Margin Calculator',
    slug: 'tp-margin-calculator',
    toolType: 'calculator',
    category: 'transfer_pricing',
    shortDescription: 'Calculate gross margins, operating margins, and markups for transfer pricing analysis.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tp-comparable-search',
    name: 'Comparable Search Demo',
    slug: 'tp-comparable-search',
    toolType: 'search',
    category: 'transfer_pricing',
    shortDescription: 'Practice searching for comparable companies in a simulated database.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tp-method-guide',
    name: 'TP Method Selector',
    slug: 'tp-method-guide',
    toolType: 'reference',
    category: 'transfer_pricing',
    shortDescription: 'Interactive guide for selecting appropriate transfer pricing methods.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const lockedTools: Tool[] = [
  {
    id: 'vat-calculator',
    name: 'VAT Calculator',
    slug: 'vat-calculator',
    toolType: 'calculator',
    category: 'vat',
    shortDescription: 'Calculate VAT amounts from net or gross figures.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'giin-search',
    name: 'GIIN Search Demo',
    slug: 'giin-search',
    toolType: 'search',
    category: 'fatca_crs',
    shortDescription: 'Practice searching FFI data and understanding GIIN structure.',
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const recentActivity = [
  { tool: 'TP Margin Calculator', action: 'Calculation saved', time: '2 hours ago' },
  { tool: 'Comparable Search', action: 'Search performed', time: '1 day ago' },
  { tool: 'TP Method Guide', action: 'Viewed', time: '3 days ago' },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-2">
          Welcome back, Sarah
        </h1>
        <p className="text-slate-600">
          Access your demo tools and continue learning
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Your Tools</p>
              <p className="text-2xl font-bold text-mojitax-navy">{userTools.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Saved Items</p>
              <p className="text-2xl font-bold text-mojitax-navy">5</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Calculations</p>
              <p className="text-2xl font-bold text-mojitax-navy">12</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Courses</p>
              <p className="text-2xl font-bold text-mojitax-navy">1</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Your Tools Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-mojitax-navy">
              Your Tools
            </h2>
            <Badge variant="success" dot size="sm">
              Transfer Pricing Fundamentals
            </Badge>
          </div>
          <Link
            href="https://mojitax.co.uk/courses"
            target="_blank"
            className="text-sm text-mojitax-green-dark hover:text-mojitax-green flex items-center gap-1"
          >
            View Course
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} hasAccess={true} />
          ))}
        </div>
      </div>
      
      {/* Recent Activity & Unlock More */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-mojitax-green" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-mojitax-navy">
                      {activity.tool}
                    </p>
                    <p className="text-xs text-slate-500">{activity.action}</p>
                  </div>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Unlock More Tools */}
        <Card className="bg-gradient-to-br from-mojitax-navy to-mojitax-navy-light text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Unlock More Tools</h3>
            <p className="text-sm text-white/80 mb-4">
              Get access to more demo tools by enrolling in additional courses.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-white/10 rounded-lg">
                <p className="text-sm font-medium">VAT Masterclass</p>
                <p className="text-xs text-white/60">4 tools included</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <p className="text-sm font-medium">FATCA Essentials</p>
                <p className="text-xs text-white/60">3 tools included</p>
              </div>
            </div>
            
            <Link href="https://mojitax.co.uk/courses" target="_blank">
              <Button
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                Browse Courses
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Locked Tools Preview */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-mojitax-navy">
            Other Available Tools
          </h2>
          <Badge variant="default" size="sm">
            Requires Course Access
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {lockedTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} hasAccess={false} variant="compact" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
