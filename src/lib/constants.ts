/**
 * Attested Intelligence - Design System Constants
 * AAA Quality Universal Landing Page
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const COLORS = {
  // Backgrounds
  void: '#0A0A0A',
  background: '#0A0A0A',
  surface: '#111111',
  surfaceAlt: '#0D0D0D',
  card: '#141414',
  cardHover: '#1A1A1A',

  // Borders
  border: '#1A1A1A',
  borderHover: '#2A2A2A',
  borderAccent: '#00D4FF33',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  textDim: '#525252',

  // Accents
  cyan: '#00D4FF',
  cyanDark: '#00A8CC',
  cyanGlow: 'rgba(0, 212, 255, 0.15)',
  amber: '#FFB800',
  amberDark: '#CC9200',
  amberGlow: 'rgba(255, 184, 0, 0.15)',

  // Semantic
  success: '#22C55E',
  successGlow: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',
  error: '#EF4444',
  errorGlow: 'rgba(239, 68, 68, 0.05)',

  // Gradients
  gradientCyan: 'linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)',
  gradientAmber: 'linear-gradient(135deg, #FFB800 0%, #CC9200 100%)',
  gradientDark: 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)',
} as const;

// ============================================================================
// NAVIGATION LINKS (Locked Sitemap)
// ============================================================================

export const NAV_LINKS = {
  products: [
    { label: 'VerifiedBundle', href: '/verifiedbundle', description: 'Seal any file with cryptographic proof' },
    { label: 'AGA Portal', href: '/aga', description: 'Runtime governance for agents' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Trust & Security', href: '/trust' },
    { label: 'Pricing', href: '/pricing' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Legal', href: '/legal' },
  ],
} as const;

// ============================================================================
// EXTERNAL LINKS
// ============================================================================

export const EXTERNAL_LINKS = {
  verifiedBundle: 'https://verifiedbundle.com',
  agaPortal: '/login',
  aiForensics: 'https://aiforensics.ai',
  registry: '/registry',
  github: 'https://github.com/attested-intelligence',
  twitter: 'https://twitter.com/attestedai',
  linkedin: 'https://linkedin.com/company/attested-intelligence',
} as const;

// ============================================================================
// TRUST BADGES
// ============================================================================

export const TRUST_BADGES = [
  { label: 'No File Storage', icon: 'shield', description: 'Files hashed client-side, never uploaded' },
  { label: 'Ed25519 Signatures', icon: 'key', description: 'Cryptographic proof of integrity' },
  { label: 'Offline Verification', icon: 'wifi-off', description: 'Verify bundles air-gapped' },
  { label: 'Deterministic Bundles', icon: 'box', description: 'Reproducible evidence packages' },
] as const;

export const CRYPTO_STANDARDS = [
  'SHA-256',
  'Ed25519',
  'RFC 8785 (JCS)',
  'Offline-First',
] as const;

// ============================================================================
// SITE CONFIGURATION
// ============================================================================

export const SITE_CONFIG = {
  name: 'Attested Intelligence',
  tagline: 'Prove software integrity. Verify it offline.',
  description: 'Create tamper-evident proof that a file or system stayed unchanged—and export a bundle anyone can verify air-gapped.',
  shortDescription: 'Seal files. Prove integrity. Verify offline.',
  domain: 'attestedintelligence.com',
  version: {
    site: '2.2.0',
    schema: '1.0',
    registry: '1.0.0',
  },
  location: 'United States',
} as const;

// ============================================================================
// PARTNER CONFIGURATION
// ============================================================================

// ============================================================================
// AGA PORTAL - DEFENSE-GRADE CONFIGURATION
// ============================================================================

/**
 * Subject Categories - Defense/Industrial domains
 * Each category represents a governed runtime environment type
 */
export const SUBJECT_CATEGORIES = [
  {
    id: 'scada',
    label: 'SCADA/ICS',
    description: 'Industrial control systems, PLCs, RTUs',
    icon: 'factory',
    color: '#FFB800',
    useCases: ['Power grid control', 'Water treatment', 'Manufacturing'],
    patentClaims: [1, 3, 4, 5, 17],
  },
  {
    id: 'autonomous_drone',
    label: 'Autonomous Drone',
    description: 'UAV flight control and mission systems',
    icon: 'plane',
    color: '#00D4FF',
    useCases: ['Reconnaissance', 'Delivery', 'Infrastructure inspection'],
    patentClaims: [1, 2, 3, 6, 7, 18],
  },
  {
    id: 'container',
    label: 'Container/K8s',
    description: 'Containerized workloads and orchestration',
    icon: 'box',
    color: '#22C55E',
    useCases: ['Microservices', 'CI/CD pipelines', 'Cloud workloads'],
    patentClaims: [1, 3, 8, 9, 10],
  },
  {
    id: 'ai_agent',
    label: 'AI Agent',
    description: 'Autonomous AI systems and LLM agents',
    icon: 'brain',
    color: '#A855F7',
    useCases: ['Autonomous trading', 'Decision systems', 'Robotics'],
    patentClaims: [1, 2, 3, 11, 12, 19],
  },
  {
    id: 'embedded',
    label: 'Embedded System',
    description: 'Firmware and embedded controllers',
    icon: 'cpu',
    color: '#EF4444',
    useCases: ['Vehicle ECUs', 'Medical devices', 'IoT sensors'],
    patentClaims: [1, 3, 4, 13, 14],
  },
  {
    id: 'custom',
    label: 'Custom Subject',
    description: 'Define custom measurement parameters',
    icon: 'settings',
    color: '#737373',
    useCases: ['Custom integration', 'Proof of concept'],
    patentClaims: [1, 3],
  },
] as const;

/**
 * Measurement Types - What the portal monitors
 * Per patent claims 1(c), 3, 6, 7
 */
export const MEASUREMENT_TYPES = [
  {
    id: 'executable_image',
    label: 'Executable Image',
    description: 'Binary hash of running process',
    patentClaims: [1, 3],
    defaultEnabled: true,
  },
  {
    id: 'loaded_modules',
    label: 'Loaded Modules',
    description: 'DLLs, shared libraries, kernel modules',
    patentClaims: [1, 3, 6],
    defaultEnabled: true,
  },
  {
    id: 'container_image',
    label: 'Container Image',
    description: 'OCI image digest verification',
    patentClaims: [1, 3, 8],
    defaultEnabled: false,
  },
  {
    id: 'config_manifest',
    label: 'Config Manifest',
    description: 'Configuration file hashes',
    patentClaims: [1, 3, 7],
    defaultEnabled: true,
  },
  {
    id: 'sbom',
    label: 'SBOM',
    description: 'Software Bill of Materials',
    patentClaims: [1, 9],
    defaultEnabled: false,
  },
  {
    id: 'tee_quote',
    label: 'TEE Quote',
    description: 'Trusted Execution Environment attestation',
    patentClaims: [1, 10, 15],
    defaultEnabled: false,
  },
  {
    id: 'memory_sample',
    label: 'Memory Sample',
    description: 'Runtime memory integrity check',
    patentClaims: [1, 3, 11],
    defaultEnabled: false,
  },
  {
    id: 'control_flow',
    label: 'Control Flow',
    description: 'CFI verification markers',
    patentClaims: [1, 12],
    defaultEnabled: false,
  },
  {
    id: 'filesystem_state',
    label: 'Filesystem State',
    description: 'Critical path monitoring',
    patentClaims: [1, 3, 13],
    defaultEnabled: false,
  },
  {
    id: 'network_config',
    label: 'Network Config',
    description: 'Network interface state',
    patentClaims: [1, 14],
    defaultEnabled: false,
  },
] as const;

/**
 * Enforcement Actions - What happens on drift detection
 * Per patent claims 1(f), 4, 5, 11
 */
export const ENFORCEMENT_ACTIONS = [
  {
    id: 'TERMINATE',
    label: 'Terminate',
    description: 'Immediate process termination',
    severity: 'critical',
    color: '#EF4444',
    patentClaims: [1, 4],
    icon: 'x-circle',
  },
  {
    id: 'QUARANTINE',
    label: 'Quarantine',
    description: 'Phantom execution mode - process runs isolated',
    severity: 'high',
    color: '#FFB800',
    patentClaims: [1, 5, 11],
    icon: 'shield-off',
  },
  {
    id: 'NETWORK_ISOLATION',
    label: 'Network Isolation',
    description: 'Sever all external network connections',
    severity: 'medium',
    color: '#F59E0B',
    patentClaims: [1, 5, 14],
    icon: 'wifi-off',
  },
  {
    id: 'SAFE_STATE',
    label: 'Safe State',
    description: 'Return to known-good configuration',
    severity: 'medium',
    color: '#22C55E',
    patentClaims: [1, 5, 16],
    icon: 'refresh-cw',
  },
  {
    id: 'ALERT',
    label: 'Alert Only',
    description: 'Log event and continue execution',
    severity: 'low',
    color: '#00D4FF',
    patentClaims: [1],
    icon: 'bell',
  },
] as const;

/**
 * Demo Scenarios - Pre-built attack demonstrations
 * For defense contractor presentations
 */
export const DEMO_SCENARIOS = [
  {
    id: 'scada_attack',
    name: 'SCADA Malware Injection',
    description: 'Simulates malware modifying PLC control logic',
    duration: 90,
    category: 'scada',
    events: [
      { time: 0, type: 'RUN_STARTED', description: 'Portal begins monitoring' },
      { time: 30, type: 'MEASUREMENT_OK', description: 'Baseline verified' },
      { time: 60, type: 'DRIFT_DETECTED', description: 'Unauthorized code modification' },
      { time: 62, type: 'QUARANTINE', description: 'Phantom mode activated' },
      { time: 90, type: 'RUN_ENDED', description: 'Evidence bundle available' },
    ],
    patentClaims: [1, 3, 4, 5, 17, 18],
  },
  {
    id: 'drone_hijack',
    name: 'Drone Hijack Attempt',
    description: 'Simulates unauthorized firmware modification',
    duration: 60,
    category: 'autonomous_drone',
    events: [
      { time: 0, type: 'RUN_STARTED', description: 'Mission start' },
      { time: 20, type: 'MEASUREMENT_OK', description: 'Flight systems nominal' },
      { time: 40, type: 'DRIFT_DETECTED', description: 'Firmware hash mismatch' },
      { time: 42, type: 'SAFE_STATE', description: 'Return-to-base initiated' },
      { time: 60, type: 'RUN_ENDED', description: 'Evidence preserved' },
    ],
    patentClaims: [1, 2, 3, 6, 7, 16, 18],
  },
  {
    id: 'config_drift',
    name: 'Unauthorized Config Change',
    description: 'Detects admin making undocumented changes',
    duration: 45,
    category: 'container',
    events: [
      { time: 0, type: 'RUN_STARTED', description: 'Container deployed' },
      { time: 15, type: 'MEASUREMENT_OK', description: 'Config baseline matched' },
      { time: 30, type: 'DRIFT_DETECTED', description: 'Config file modified' },
      { time: 32, type: 'ALERT', description: 'Alert emitted, audit trail created' },
      { time: 45, type: 'RUN_ENDED', description: 'Bundle exported' },
    ],
    patentClaims: [1, 3, 7, 8, 9],
  },
  {
    id: 'ai_model_swap',
    name: 'AI Model Substitution',
    description: 'Detects unauthorized model weight changes',
    duration: 75,
    category: 'ai_agent',
    events: [
      { time: 0, type: 'RUN_STARTED', description: 'Agent initialization' },
      { time: 25, type: 'MEASUREMENT_OK', description: 'Model weights verified' },
      { time: 50, type: 'DRIFT_DETECTED', description: 'Model checksum mismatch' },
      { time: 52, type: 'TERMINATE', description: 'Execution halted' },
      { time: 75, type: 'RUN_ENDED', description: 'Forensic evidence sealed' },
    ],
    patentClaims: [1, 2, 3, 11, 12, 19, 20],
  },
] as const;

/**
 * Patent Claims Summary
 * For display on UI elements
 */
export const PATENT_CLAIMS = {
  1: { title: 'Runtime Integrity Enforcement', independent: true },
  2: { title: 'Privacy-Preserving Disclosure', independent: true },
  3: { title: 'Continuity Chain System', independent: true },
  4: { title: 'Process Termination', independent: false },
  5: { title: 'Quarantine Mode', independent: false },
  6: { title: 'Module Verification', independent: false },
  7: { title: 'Configuration Binding', independent: false },
  8: { title: 'Container Image Attestation', independent: false },
  9: { title: 'SBOM Integration', independent: false },
  10: { title: 'TEE Attestation', independent: false },
  11: { title: 'Phantom Execution', independent: false },
  12: { title: 'Control Flow Integrity', independent: false },
  13: { title: 'Filesystem Monitoring', independent: false },
  14: { title: 'Network Isolation', independent: false },
  15: { title: 'Hardware Root of Trust', independent: false },
  16: { title: 'Safe State Recovery', independent: false },
  17: { title: 'Genesis Event', independent: false },
  18: { title: 'Merkle Proof Batching', independent: false },
  19: { title: 'Checkpoint Anchoring', independent: false },
  20: { title: 'Evidence Bundle Export', independent: false },
} as const;

// ============================================================================
// PARTNER CONFIGURATION
// ============================================================================

export const PARTNERS = {
  aiForensics: {
    name: 'AI Forensics',
    tagline: 'Deepfake Detection & Digital Provenance',
    description: 'AI Forensics integrates VerifiedBundle to provide tamper-evident proof of authenticity for media files, protecting against synthetic content manipulation.',
    url: 'https://aiforensics.ai',
    logo: '/partners/aiforensics-logo.svg',
    features: [
      'Deepfake detection with cryptographic sealing',
      'Media provenance verification',
      'Tamper-evident evidence bundles',
      'Legal-grade authenticity proof',
    ],
  },
} as const;

// ============================================================================
// SCHEMA.ORG STRUCTURED DATA
// ============================================================================

export const SCHEMA_ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Attested Intelligence',
  url: 'https://attestedintelligence.com',
  logo: 'https://attestedintelligence.com/logo.png',
  description: SITE_CONFIG.description,
  foundingDate: '2024',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
  sameAs: [
    EXTERNAL_LINKS.github,
    EXTERNAL_LINKS.twitter,
    EXTERNAL_LINKS.linkedin,
  ],
} as const;
