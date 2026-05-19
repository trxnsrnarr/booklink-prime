
-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  amount_idr INTEGER NOT NULL CHECK (amount_idr > 0),
  coin_amount INTEGER NOT NULL CHECK (coin_amount > 0),
  bonus_coin INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','expired','cancel')),
  payment_type TEXT,
  snap_token TEXT,
  midtrans_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_owner_select ON public.transactions FOR SELECT USING (user_id = auth.uid());
-- Writes only via security-definer functions; no insert/update policy for users.

CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Coin packages
CREATE TABLE public.coin_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coin_amount INTEGER NOT NULL CHECK (coin_amount > 0),
  bonus_coin INTEGER NOT NULL DEFAULT 0,
  price_idr INTEGER NOT NULL CHECK (price_idr > 0),
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY coin_packages_select_all ON public.coin_packages FOR SELECT USING (is_active);

INSERT INTO public.coin_packages (name, coin_amount, bonus_coin, price_idr, is_popular, sort_order) VALUES
  ('Starter', 50, 0, 10000, false, 1),
  ('Reader', 120, 10, 20000, false, 2),
  ('Popular', 320, 40, 50000, true, 3),
  ('Power', 700, 100, 100000, false, 4),
  ('Mega', 1600, 300, 200000, false, 5);

-- VIP on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vip_until TIMESTAMPTZ;

-- Server-fn: create a pending transaction (called from server fn after auth)
CREATE OR REPLACE FUNCTION public.create_pending_transaction(
  _user_id UUID,
  _order_id TEXT,
  _amount_idr INTEGER,
  _coin_amount INTEGER,
  _bonus_coin INTEGER
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  INSERT INTO public.transactions (user_id, order_id, amount_idr, coin_amount, bonus_coin, status)
  VALUES (_user_id, _order_id, _amount_idr, _coin_amount, _bonus_coin, 'pending')
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Webhook handler: idempotent coin granting
CREATE OR REPLACE FUNCTION public.fulfill_transaction(
  _order_id TEXT,
  _status TEXT,
  _payment_type TEXT,
  _midtrans JSONB
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  txn public.transactions;
  total_coin INTEGER;
BEGIN
  SELECT * INTO txn FROM public.transactions WHERE order_id = _order_id FOR UPDATE;
  IF txn IS NULL THEN
    RETURN 'not_found';
  END IF;

  -- Idempotency: already finalized
  IF txn.status IN ('success','failed','expired','cancel') THEN
    RETURN 'already_'||txn.status;
  END IF;

  IF _status = 'success' THEN
    total_coin := txn.coin_amount + COALESCE(txn.bonus_coin,0);
    UPDATE public.profiles SET coin_balance = coin_balance + total_coin WHERE id = txn.user_id;
    UPDATE public.transactions
      SET status = 'success', payment_type = _payment_type, midtrans_response = _midtrans, paid_at = now()
      WHERE id = txn.id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (txn.user_id, 'payment', 'Top-up berhasil 🎉', total_coin||' koin masuk ke akunmu.', '/wallet');
    RETURN 'granted';
  ELSE
    UPDATE public.transactions
      SET status = _status, payment_type = _payment_type, midtrans_response = _midtrans
      WHERE id = txn.id;
    RETURN 'updated_'||_status;
  END IF;
END;
$$;
