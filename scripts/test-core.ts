import assert from "node:assert/strict";
import { canTransitionOrder } from "../src/features/orders/transitions";
import { canTransitionListing } from "../src/features/merchant/services/listing-transitions";
import { decryptSecret, encryptSecret } from "../src/lib/secrets";

function run() {
  assert.equal(canTransitionOrder("CREATED", "CONFIRMED"), true);
  assert.equal(canTransitionOrder("CREATED", "SHIPPED"), false);
  assert.equal(canTransitionOrder("SHIPPED", "RETURNED"), true);

  assert.equal(canTransitionListing("DELISTED", "LISTED"), true);
  assert.equal(canTransitionListing("LISTED", "LISTED"), false);

  const secret = "top-secret-token";
  const encrypted = encryptSecret(secret);
  assert.ok(encrypted);
  assert.equal(decryptSecret(encrypted), secret);

  console.log("Core checks passed.");
}

run();
