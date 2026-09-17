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
    const history = await prisma.analysisHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol, signal, entryPrice, stopLoss, takeProfit } = await req.json();

    if (!symbol || !signal || entryPrice === undefined || stopLoss === undefined || takeProfit === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const historyRecord = await prisma.analysisHistory.create({
      data: {
        userId: session.user.id,
        symbol,
        signal,
        entryPrice,
        stopLoss,
        takeProfit,
      },
    });

    return NextResponse.json(historyRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating history record:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
