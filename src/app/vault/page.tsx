'use client';

/**
 * Vault Dashboard Page
 * Per AGA Build Guide Phase 7.1
 *
 * Displays all user's artifacts as cards.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Plus,
  Search,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { VaultCard, type VaultCardData } from '@/components/vault';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'grid' | 'list';
type SortBy = 'created' | 'name' | 'status' | 'expires';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'active' | 'expired' | 'revoked';

// ============================================================================
// MOCK DATA (would come from API/database in production)
// ============================================================================

const MOCK_ARTIFACTS: VaultCardData[] = [
  {
    id: '1',
    artifactId: 'art_demo_001',
    vaultId: '1234-56789-0123',
    displayName: 'Contract Agreement v2.1',
    description: 'Final version of the service agreement with updated terms.',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sealedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    bytesHash: '8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52',
    metadataHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
    policyHash: 'f5d6e7890123456789abcdef0123456789abcdef0123456789abcdef01234567',
    settings: {
      measurementCadenceMs: 3600000,
      enforcementAction: 'ALERT',
      payloadIncluded: true,
    },
    receiptCount: 12,
    attestationCount: 2,
  },
  {
    id: '2',
    artifactId: 'art_demo_002',
    vaultId: '1234-56789-0123',
    displayName: 'Audit Report Q4 2024',
    description: 'Quarterly financial audit documentation.',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    sealedHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    bytesHash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    metadataHash: '567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    policyHash: '90abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    settings: {
      measurementCadenceMs: 86400000,
      enforcementAction: 'KILL',
      payloadIncluded: false,
    },
    receiptCount: 5,
    attestationCount: 0,
  },
  {
    id: '3',
    artifactId: 'art_demo_003',
    vaultId: '1234-56789-0123',
    displayName: 'Software License v1.0',
    status: 'EXPIRED',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sealedHash: 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    bytesHash: 'beefcafe1234567890abcdef1234567890abcdef1234567890abcdef1234',
    metadataHash: 'cafebabe1234567890abcdef1234567890abcdef1234567890abcdef1234',
    policyHash: 'baadf00d1234567890abcdef1234567890abcdef1234567890abcdef1234',
    settings: {
      measurementCadenceMs: 3600000,
      enforcementAction: 'ALERT',
      payloadIncluded: true,
    },
    receiptCount: 45,
    attestationCount: 3,
  },
];

// ============================================================================
// STATUS COUNTS
// ============================================================================

function StatusCounts({ artifacts }: { artifacts: VaultCardData[] }) {
  const counts = useMemo(() => {
    return {
      total: artifacts.length,
      active: artifacts.filter((a) => a.status === 'ACTIVE').length,
      expired: artifacts.filter((a) => a.status === 'EXPIRED').length,
      revoked: artifacts.filter((a) => a.status === 'REVOKED').length,
    };
  }, [artifacts]);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Shield className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">Total</span>
        </div>
        <p className="text-2xl font-bold">{counts.total}</p>
      </div>
      <div className="p-4 rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">Active</span>
        </div>
        <p className="text-2xl font-bold">{counts.active}</p>
      </div>
      <div className="p-4 rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <Clock className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">Expired</span>
        </div>
        <p className="text-2xl font-bold">{counts.expired}</p>
      </div>
      <div className="p-4 rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <XCircle className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">Revoked</span>
        </div>
        <p className="text-2xl font-bold">{counts.revoked}</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VaultPage() {
  const [artifacts, _setArtifacts] = useState<VaultCardData[]>(MOCK_ARTIFACTS);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter and sort artifacts
  const filteredArtifacts = useMemo(() => {
    let result = [...artifacts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.displayName.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.artifactId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((a) => a.status.toLowerCase() === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'expires':
          const aExpires = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
          const bExpires = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
          comparison = aExpires - bExpires;
          break;
        case 'created':
        default:
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [artifacts, searchQuery, filterStatus, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // In production, would fetch from API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Vault</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your sealed artifacts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
              <Link href="/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Artifact
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Status Overview */}
        <StatusCounts artifacts={artifacts} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters & Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={(v: FilterStatus) => setFilterStatus(v)}>
              <SelectTrigger className="w-[130px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: SortBy) => setSortBy(v)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="expires">Expires</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>

            {/* View Toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-none"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Artifacts Grid/List */}
        <AnimatePresence mode="popLayout">
          {filteredArtifacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No artifacts found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first sealed artifact to get started'}
              </p>
              <Link href="/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Artifact
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              )}
            >
              {filteredArtifacts.map((artifact) => (
                <motion.div
                  key={artifact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <VaultCard
                    data={artifact}
                    onVerify={() => console.log('Verify:', artifact.artifactId)}
                    onShare={() => console.log('Share:', artifact.artifactId)}
                    className={viewMode === 'list' ? 'max-w-full' : ''}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
