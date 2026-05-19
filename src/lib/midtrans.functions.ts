import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SANDBOX_API = "https://app.sandbox.midtrans.com/snap/v1/transactions";

export const createTopupTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ package_id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    if (!serverKey || !clientKey) throw new Error("Midtrans keys not configured");

    // Load package
    const { data: pkg, error: pErr } = await supabase
      .from("coin_packages")
      .select("*")
      .eq("id", data.package_id)
      .eq("is_active", true)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pkg) throw new Error("Paket tidak ditemukan");

    // Profile (for customer details)
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", userId)
      .maybeSingle();

    const orderId = `BL-${Date.now()}-${userId.slice(0, 8)}`;

    // Insert pending transaction (admin via service role)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: tErr } = await supabaseAdmin.rpc("create_pending_transaction", {
      _user_id: userId,
      _order_id: orderId,
      _amount_idr: pkg.price_idr,
      _coin_amount: pkg.coin_amount,
      _bonus_coin: pkg.bonus_coin,
    });
    if (tErr) throw new Error("Gagal membuat transaksi: " + tErr.message);

    const auth = "Basic " + Buffer.from(serverKey + ":").toString("base64");
    const body = {
      transaction_details: { order_id: orderId, gross_amount: pkg.price_idr },
      item_details: [
        {
          id: pkg.id,
          name: `${pkg.name} - ${pkg.coin_amount}${pkg.bonus_coin ? `+${pkg.bonus_coin}` : ""} koin`,
          price: pkg.price_idr,
          quantity: 1,
          category: "coin",
        },
      ],
      customer_details: {
        first_name: profile?.display_name ?? profile?.username ?? "Reader",
      },
      enabled_payments: ["qris", "gopay", "shopeepay", "other_qris", "bca_va", "bni_va", "bri_va", "permata_va", "other_va", "dana"],
      credit_card: { secure: true },
    };

    const res = await fetch(SANDBOX_API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.token) {
      console.error("Midtrans error", json);
      throw new Error(json.error_messages?.[0] ?? "Gagal membuat transaksi Midtrans");
    }

    // Save snap token
    await supabaseAdmin
      .from("transactions")
      .update({ snap_token: json.token })
      .eq("order_id", orderId);

    return {
      order_id: orderId,
      snap_token: json.token,
      client_key: clientKey,
      redirect_url: json.redirect_url,
    };
  });

export const getMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { transactions: data ?? [] };
  });
