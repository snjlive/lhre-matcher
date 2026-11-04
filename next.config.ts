import type {NextConfig} from 'next';
import {PHASE_DEVELOPMENT_SERVER} from 'next/constants';

export default function config(phase: string): NextConfig {
  // Keep build checks from replacing JavaScript served by the running dev server.
  return {distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'};
}
