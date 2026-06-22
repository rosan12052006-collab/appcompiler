import React, { useState, useRef, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const EXAMPLES = [
  "Build a CRM with login, contacts, dashboard, role-based access for admin and sales reps, and premium plan with Stripe payments. Admins can see full analytics.",
  "Create a project management tool with sprints, kanban board, issue tracking, team members, and time logging. Support guest viewers.",
  "Build an e-commerce store with product catalog, cart, checkout with Stripe, order tracking, admin inventory panel, and customer reviews.",
  "HR onboarding app: new hire portal, document uploads, task checklists, manager approval flows, and IT provisioning tickets.",
  "Build a school LMS with courses, video lessons, quizzes, student grades, and teacher dashboards.",
];

const EVAL_DATA = [
  { id: 1, prompt: "CRM with login, contacts, and payments", type: "Normal", status: "pass", retries: 0, latency: "4.2s" },
  { id: 2, prompt: "Project management with sprints and kanban", type: "Normal", status: "pass", retries: 0, latency: "3.8s" },
  { id: 3, prompt: "E-commerce with Stripe checkout", type: "Normal", status: "pass", retries: 1, latency: "5.1s" },
  { id: 4, prompt: "HR onboarding with approvals", type: "Normal", status: "pass", retries: 0, latency: "4.5s" },
  { id: 5, prompt: "Social media clone with reels", type: "Normal", status: "pass", retries: 0, latency: "4.9s" },
  { id: 6, prompt: "School LMS with quizzes and grades", type: "Normal", status: "pass", retries: 1, latency: "5.3s" },
  { id: 7, prompt: "Hospital booking and EMR system", type: "Normal", status: "pass", retries: 0, latency: "4.7s" },
  { id: 8, prompt: "Real estate marketplace with agents", type: "Normal", status: "pass", retries: 0, latency: "4.1s" },
  { id: 9, prompt: "Food delivery app with restaurants", type: "Normal", status: "pass", retries: 1, latency: "5.6s" },
  { id: 10, prompt: "SaaS analytics dashboard for devs", type: "Normal", status: "pass", retries: 0, latency: "3.9s" },
  { id: 11, prompt: "App", type: "Vague", status: "clarify", retries: 0, latency: "0.1s" },
  { id: 12, prompt: "Build something cool", type: "Vague", status: "clarify", retries: 0, latency: "0.1s" },
  { id: 13, prompt: "Free app but also charge users monthly", type: "Conflict", status: "repair", retries: 1, latency: "6.2s" },
  { id: 14, prompt: "Admin can't see data but also sees all data", type: "Conflict", status: "repair", retries: 2, latency: "7.1s" },
  { id: 15, prompt: "Add payments", type: "Incomplete", status: "clarify", retries: 0, latency: "0.1s" },
  { id: 16, prompt: "Blog with comments and... idk, make it good", type: "Vague", status: "pass", retries: 1, latency: "5.4s" },
  { id: 17, prompt: "Chat app but no real-time, only real-time", type: "Conflict", status: "repair", retries: 2, latency: "7.8s" },
  { id: 18, prompt: "Build a marketplace in 1 table", type: "Conflict", status: "repair", retries: 1, latency: "6.5s" },
  { id: 19, prompt: "Todo app but enterprise grade SOC2 HIPAA", type: "Incomplete", status: "pass", retries: 1, latency: "5.0s" },
  { id: 20, prompt: "...", type: "Vague", status: "clarify", retries: 0, latency: "0.1s" },
];

const S = {
  app: { maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' },
  header: { marginBottom: '2rem', borderBottom: '1px solid #2a2a3a', paddingBottom: '1.5rem' },
  headerTitle: { fontSize: 28, fontWeight: 600, color: '#a78bfa', letterSpacing: '-0.5px' },
  headerSub: { fontSize: 13, color: '#6b6b8a', marginTop: 6 },
  pipelineBar: { display: 'flex', gap: 0, marginBottom: '1.5rem', borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a3a' },
  stagePill: (state) => ({
    flex: 1, padding: '8px 6px', textAlign: 'center', fontSize: 11, fontWeight: 500,
    background: state === 'done' ? '#14532d' : state === 'active' ? '#312e81' : state === 'error' ? '#7f1d1d' : '#1a1a24',
    color: state === 'done' ? '#86efac' : state === 'active' ? '#c4b5fd' : state === 'error' ? '#fca5a5' : '#6b6b8a',
    borderRight: '1px solid #2a2a3a', transition: 'all 0.4s',
  }),
  textarea: {
    width: '100%', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 10,
    padding: '12px 14px', fontSize: 14, color: '#e8e8f0', fontFamily: 'Inter, sans-serif',
    resize: 'vertical', minHeight: 90, outline: 'none', marginBottom: 10,
  },
  examplesRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' },
  exampleBtn: {
    fontSize: 11, padding: '4px 10px', borderRadius: 20,
    border: '1px solid #2a2a3a', background: '#1a1a24', color: '#9898b8', cursor: 'pointer',
  },
  runBtn: (loading) => ({
    width: '100%', padding: '11px', borderRadius: 10,
    border: '1px solid #7c3aed', background: loading ? '#1e1b4b' : '#312e81',
    color: '#c4b5fd', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }),
  logPanel: { marginTop: '1rem', background: '#0d0d14', border: '1px solid #2a2a3a', borderRadius: 10, overflow: 'hidden' },
  logHeader: { padding: '8px 12px', borderBottom: '1px solid #2a2a3a', fontSize: 12, color: '#6b6b8a', display: 'flex', justifyContent: 'space-between' },
  logBody: { padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, maxHeight: 200, overflowY: 'auto' },
  logLine: (type) => ({
    padding: '2px 0', lineHeight: 1.6,
    color: type === 'success' ? '#86efac' : type === 'warn' ? '#fbbf24' : type === 'error' ? '#fca5a5' : '#818cf8',
  }),
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #2a2a3a', marginTop: '1.5rem' },
  tab: (active) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    color: active ? '#a78bfa' : '#6b6b8a',
    borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
    background: 'transparent', border: 'none', marginBottom: -1,
  }),
  schemaBlock: { background: '#0d0d14', border: '1px solid #2a2a3a', borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  schemaHeader: { padding: '8px 12px', borderBottom: '1px solid #2a2a3a', fontSize: 12, color: '#9898b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  schemaBody: { padding: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#c4b5fd', maxHeight: 260, overflowY: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 },
  metricCard: { background: '#1a1a24', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid #2a2a3a' },
  metricVal: { fontSize: 24, fontWeight: 600, color: '#a78bfa' },
  metricLabel: { fontSize: 11, color: '#6b6b8a', marginTop:
