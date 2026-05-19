
REVOKE ALL ON FUNCTION public.create_pending_transaction(UUID, TEXT, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fulfill_transaction(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
