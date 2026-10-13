BEGIN;

WITH recalculated AS (
  SELECT
    orders.id,
    COALESCE((
      SELECT SUM(
        COALESCE((item->>'quantity')::integer, 0) * (
          CASE
            WHEN jsonb_array_length(COALESCE(item->'toppings', '[]'::jsonb)) = 0 THEN 300
            ELSE 350
          END
          - CASE
              WHEN COALESCE((item->>'instagramFollow')::boolean, false) THEN 50
              ELSE 0
            END
        )
      )
      FROM jsonb_array_elements(COALESCE(orders.order_data->'taiyaki', '[]'::jsonb)) AS item
    ), 0)
    + LEAST(
        COALESCE((orders.order_data #>> '{memos,student}')::integer, 0),
        COALESCE((orders.order_data #>> '{memos,guardian}')::integer, 0)
      ) * 1000
    + GREATEST(
        COALESCE((orders.order_data #>> '{memos,student}')::integer, 0)
        - COALESCE((orders.order_data #>> '{memos,guardian}')::integer, 0),
        0
      ) * 500
    + GREATEST(
        COALESCE((orders.order_data #>> '{memos,guardian}')::integer, 0)
        - COALESCE((orders.order_data #>> '{memos,student}')::integer, 0),
        0
      ) * 600 AS corrected_total
  FROM taiyaki_orders AS orders
  WHERE orders.created_at >= TIMESTAMPTZ '2026-10-10 10:00:00+09'
    AND orders.created_at < TIMESTAMPTZ '2026-10-11 00:00:00+09'
)
UPDATE taiyaki_orders AS orders
SET total_yen = recalculated.corrected_total
FROM recalculated
WHERE orders.id = recalculated.id
RETURNING orders.created_at, orders.total_yen;

COMMIT;
