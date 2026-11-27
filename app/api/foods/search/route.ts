import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { searchFoods, UsdaRateLimitError } from "@/lib/usda";

export async function GET(request: NextRequest) {
  if (!(await getUser())) return NextResponse.json({ error: "Signed out" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ foods: [] });
  if (q.length > 100) return NextResponse.json({ error: "Search is too long" }, { status: 400 });

  try {
    return NextResponse.json({ foods: await searchFoods(q) });
  } catch (e) {
    if (e instanceof UsdaRateLimitError) {
      return NextResponse.json(
        { error: "Food search is busy. Add a USDA_API_KEY to raise the limit, or try again in a bit." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Food search is unavailable right now" }, { status: 502 });
  }
}
