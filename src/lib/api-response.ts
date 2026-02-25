import { NextResponse } from "next/server";
import { ApiAuthError } from "@/lib/api-auth";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return fail(error.message, error.status);
  }
  if (error instanceof Error) {
    return fail(error.message, 400);
  }
  return fail("UNKNOWN_ERROR", 500);
}
