import { NextRequest, NextResponse } from "next/server";
import { getExtensionAuth } from "@/lib/extension-auth";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Proxy the signed-in user's uploaded resume file for the extension autofill flow.
 * Avoids adding storage host permissions to the extension and respects expert RLS via profile_id.
 */
export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId")?.trim();
  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase } = auth;

  const { data: expert, error } = await supabase
    .from("experts")
    .select("resume_url")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not load resume metadata" },
      { status: 500 }
    );
  }

  const url = typeof expert?.resume_url === "string" ? expert.resume_url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "No resume file on profile" }, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return NextResponse.json({ error: "Resume download failed" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: "Resume storage returned an error" }, { status: 502 });
  }

  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Resume file too large" }, { status: 413 });
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";

  let downloadName = "resume.pdf";
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop();
    if (seg && /\.(pdf|doc|docx|txt|rtf)$/i.test(seg)) {
      downloadName = decodeURIComponent(seg);
    } else if (contentType.includes("pdf")) {
      downloadName = "resume.pdf";
    } else if (contentType.includes("wordprocessingml")) {
      downloadName = "resume.docx";
    } else if (contentType.includes("msword")) {
      downloadName = "resume.doc";
    }
  } catch {
    /* keep default */
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "X-Resume-Filename": downloadName,
    },
  });
}
