import { processChannelOrderEvent } from "@/features/orders/channel-events.service";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";
import { NextRequest, NextResponse } from "next/server";

type WebhookBody = {
  type: "ORDER_CANCELLED_BY_CUSTOMER" | "ORDER_RETURNED_TO_WAREHOUSE";
  externalOrderId: string;
  occurredAt?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await request.json()) as WebhookBody;

  const channel = await prisma.channel.findUnique({
    where: { id },
  });
  if (!channel) {
    return NextResponse.json({ error: "CHANNEL_NOT_FOUND" }, { status: 404 });
  }

  const incomingSecret = request.headers.get("x-webhook-secret") ?? "";
  const expectedSecret = decryptSecret(channel.webhookSecret);
  if (!expectedSecret || incomingSecret !== expectedSecret) {
    return NextResponse.json({ error: "INVALID_WEBHOOK_SECRET" }, { status: 401 });
  }

  if (!body?.type || !body?.externalOrderId) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  try {
    const result = await processChannelOrderEvent({
      channelId: id,
      type: body.type,
      externalOrderId: body.externalOrderId,
      occurredAt: body.occurredAt,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 }
    );
  }
}
