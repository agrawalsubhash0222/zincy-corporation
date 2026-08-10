# PhonePe UPI validation hotfix

This hotfix keeps PhonePe Standard Checkout restricted to UPI while accepting
all PhonePe-documented UPI status modes:

- `UPI_INTENT`
- `UPI_QR`
- `UPI_COLLECT`

It continues to reject `CARD`, `TOKEN`, `NET_BANKING`, and unknown or missing
payment modes. The create-payment request explicitly enables only the three UPI
flows.

## Files

- `backend/src/main/java/com/zincycorporation/service/PhonePeClient.java`
- `backend/src/main/java/com/zincycorporation/service/PaymentService.java`
- `backend/src/test/java/com/zincycorporation/service/PhonePeClientTest.java`

## Verification

Run `mvn clean test` inside `backend` after copying the files.
