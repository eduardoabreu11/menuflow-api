BEGIN;

CREATE OR REPLACE FUNCTION prevent_subscription_for_non_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE id = NEW.owner_user_id
      AND role::text = 'RESTAURANT_OWNER'
  ) THEN
    RAISE EXCEPTION 'Apenas usuários RESTAURANT_OWNER podem ter assinatura.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_subscription_for_non_owner
ON subscriptions;

CREATE TRIGGER trg_prevent_subscription_for_non_owner
BEFORE INSERT OR UPDATE OF owner_user_id
ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION prevent_subscription_for_non_owner();


CREATE OR REPLACE FUNCTION prevent_payment_for_non_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE id = NEW.owner_user_id
      AND role::text = 'RESTAURANT_OWNER'
  ) THEN
    RAISE EXCEPTION 'Apenas usuários RESTAURANT_OWNER podem ter fatura.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_payment_for_non_owner
ON payments;

CREATE TRIGGER trg_prevent_payment_for_non_owner
BEFORE INSERT OR UPDATE OF owner_user_id
ON payments
FOR EACH ROW
EXECUTE FUNCTION prevent_payment_for_non_owner();

COMMIT;