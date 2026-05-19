import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/midtrans/notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) return new Response("Server not configured", { status: 500 });

        let payload: Record<string, unknown>;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const orderId = String(payload.order_id ?? "");
        const statusCode = String(payload.status_code ?? "");
        const grossAmount = String(payload.gross_amount ?? "");
        const signatureKey = String(payload.signature_key ?? "");
        const transactionStatus = String(payload.transaction_status ?? "");
        const fraudStatus = String(payload.fraud_status ?? "accept");
        const paymentType = String(payload.payment_type ?? "");

        if (!orderId || !signatureKey) {
          return new Response("Missing fields", { status: 400 });
        }

        // Verify signature (sha512)
        const expected = createHash("sha512")
          .update(orderId + statusCode + grossAmount + serverKey)
          .digest("hex");
        if (expected !== signatureKey) {
          console.warn("Midtrans signature mismatch", { orderId });
          return new Response("Invalid signature", { status: 401 });
        }

        // Map status
        let mapped: "success" | "failed" | "expired" | "cancel" | "pending" = "pending";
        if (transactionStatus === "capture" || transactionStatus === "settlement") {
          mapped = fraudStatus === "accept" ? "success" : "failed";
        } else if (transactionStatus === "deny" || transactionStatus === "failure") {
          mapped = "failed";
        } else if (transactionStatus === "expire") {
          mapped = "expired";
        } else if (transactionStatus === "cancel") {
          mapped = "cancel";
        }

        if (mapped === "pending") {
          return new Response("ok", { status: 200 });
        }

        const { data, error } = await supabaseAdmin.rpc("fulfill_transaction", {
          _order_id: orderId,
          _status: mapped,
          _payment_type: paymentType,
          _midtrans: JSON.parse(JSON.stringify(payload)),
        });
        if (error) {
          console.error("fulfill_transaction error", error);
          return new Response("Internal error", { status: 500 });
        }
        return new Response(JSON.stringify({ ok: true, result: data }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
      // Midtrans sometimes pings GET for connectivity test
      GET: async () => new Response("ok"),
    },
  },
});
