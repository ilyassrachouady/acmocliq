import type { Comparable, SubjectProperty } from "@/lib/demo-data";
import { createClient } from "@/utils/supabase/client";

export type SavedWorkspace = { reportId: string; workflowStep: number; comparables: Comparable[]; subject?: SubjectProperty };

export type AcmReportSummary = {
  id: string;
  title: string;
  status: "draft" | "ready" | "archived";
  workflowStep: number;
  subjectAddress: string;
  subjectCity: string;
  updatedAt: string;
};

async function requireUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw error ?? new Error("Session requise");
  return { supabase, user };
}

export async function listReports(): Promise<AcmReportSummary[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("acm_reports")
    .select("id, title, status, workflow_step, subject_address, subject_city, updated_at")
    .eq("owner_id", user.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((report) => ({
    id: report.id,
    title: report.title,
    status: report.status,
    workflowStep: report.workflow_step,
    subjectAddress: report.subject_address || "Adresse à compléter",
    subjectCity: report.subject_city || "Municipalité à compléter",
    updatedAt: report.updated_at,
  }));
}

export async function createWorkspace(seed: Comparable[], subject?: SubjectProperty): Promise<SavedWorkspace> {
  const { supabase, user } = await requireUser();
  const created = await supabase.from("acm_reports").insert({
    owner_id: user.id,
    title: "Nouvelle analyse comparative",
    subject_address: "Adresse à compléter",
    subject_city: "Municipalité à compléter",
    subject_data: subject ?? {},
    workflow_step: 0,
  }).select("id, workflow_step").single();
  if (created.error) throw created.error;
  const isolatedSeed = seed.map((item) => ({ ...item, id: crypto.randomUUID() }));
  await saveWorkspace(created.data.id, 0, isolatedSeed, subject);
  return { reportId: created.data.id, workflowStep: 0, comparables: isolatedSeed, subject };
}

export async function loadWorkspace(reportId: string): Promise<SavedWorkspace> {
  const { supabase } = await requireUser();
  const { data: report, error: reportError } = await supabase.from("acm_reports")
    .select("id, workflow_step, subject_data").eq("id", reportId).single();
  if (reportError) throw reportError;
  const { data: rows, error: comparableError } = await supabase.from("comparables")
    .select("data").eq("report_id", reportId).order("sort_order");
  if (comparableError) throw comparableError;
  return { reportId: report.id, workflowStep: report.workflow_step, comparables: (rows ?? []).map((row) => row.data as Comparable), subject: report.subject_data as SubjectProperty };
}

export async function markReportReady(reportId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("acm_reports").update({ status: "ready", workflow_step: 5 }).eq("id", reportId);
  if (error) throw error;
}

export async function archiveReport(reportId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("acm_reports").update({ status: "archived" }).eq("id", reportId);
  if (error) throw error;
}

export async function loadOrCreateWorkspace(seed: Comparable[]): Promise<SavedWorkspace> {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError ?? new Error("Session requise");

  const { data: existing, error: reportError } = await supabase
    .from("acm_reports")
    .select("id, workflow_step")
    .eq("owner_id", user.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reportError) throw reportError;

  let report = existing;
  if (!report) {
    const created = await supabase.from("acm_reports").insert({
      owner_id: user.id,
      title: "ACM - 218, rue des Pins",
      subject_address: "218, rue des Pins",
      subject_city: "Rouyn-Noranda",
      subject_postal_code: "J9X 5M2",
      workflow_step: 1,
    }).select("id, workflow_step").single();
    if (created.error) throw created.error;
    report = created.data;
    await saveWorkspace(report.id, report.workflow_step, seed);
  }

  const { data: rows, error: comparableError } = await supabase
    .from("comparables")
    .select("data")
    .eq("report_id", report.id)
    .order("sort_order");
  if (comparableError) throw comparableError;
  return {
    reportId: report.id,
    workflowStep: report.workflow_step,
    comparables: rows?.length ? rows.map((row) => row.data as Comparable) : seed,
  };
}

export async function saveWorkspace(reportId: string, workflowStep: number, comparables: Comparable[], subject?: SubjectProperty) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError ?? new Error("Session requise");
  const reportUpdate = await supabase.from("acm_reports").update({ workflow_step: workflowStep, ...(subject ? { title: `ACM - ${subject.address || "Nouvelle analyse comparative"}`, subject_address: subject.address, subject_city: subject.city, subject_postal_code: subject.postalCode, subject_data: subject } : {}) }).eq("id", reportId);
  if (reportUpdate.error) throw reportUpdate.error;
  if (!comparables.length) {
    const cleared = await supabase.from("comparables").delete().eq("report_id", reportId);
    if (cleared.error) throw cleared.error;
    return;
  }
  const rows = comparables.map((item, index) => ({
    id: item.id,
    report_id: reportId,
    owner_id: user.id,
    address: item.address,
    city: item.city,
    status: item.status,
    price: item.price,
    adjustment: item.adjustment,
    adjusted: item.adjusted,
    included: item.included,
    sort_order: index,
    data: item,
  }));
  const saved = await supabase.from("comparables").upsert(rows, { onConflict: "id" });
  if (saved.error) throw saved.error;
}

export async function signOut() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Demo mode and missing keys still return to the landing screen.
  }
  window.location.assign("/");
}

export type BrokerBranding = {
  brokerTitle: string;
  slogan: string;
  agencyName: string;
  logoDataUrl: string;
};

export const defaultBranding: BrokerBranding = {
  brokerTitle: "Courtier immobilier résidentiel",
  slogan: "La valeur expliquée avec clarté.",
  agencyName: "",
  logoDataUrl: "",
};

export type BrokerProfile = {
  full_name: string;
  brokerage_name: string;
  phone: string;
  email: string;
  branding?: BrokerBranding;
};

export async function loadProfile(): Promise<BrokerProfile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session requise");
  const { data, error } = await supabase.from("profiles").select("full_name, brokerage_name, phone, email").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return {
    full_name: data?.full_name || user.user_metadata.full_name || "",
    brokerage_name: data?.brokerage_name || "",
    phone: data?.phone || "",
    email: data?.email || user.email || "",
  };
}

export async function saveProfile(profile: BrokerProfile) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session requise");
  const { error } = await supabase.from("profiles").upsert({ id: user.id, ...profile }, { onConflict: "id" });
  if (error) throw error;
}
