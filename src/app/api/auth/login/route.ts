import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await login(formData);
  return NextResponse.json(result);
}
