import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(watchlists);
  } catch (error) {
    console.error("Error fetching watchlists:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol } = await req.json();

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const existing = await prisma.watchlist.findFirst({
      where: {
        userId: session.user.id,
        symbol: symbol,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Symbol already in watchlist" }, { status: 400 });
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        symbol,
      },
    });

    return NextResponse.json(watchlist, { status: 201 });
  } catch (error) {
    console.error("Error creating watchlist item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.watchlist.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting watchlist item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
