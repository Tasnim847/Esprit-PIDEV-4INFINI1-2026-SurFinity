package org.example.projet_pi.Controller;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.projet_pi.Service.PaymentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payments/stripe")
@RequiredArgsConstructor  // ← Changé de @AllArgsConstructor à @RequiredArgsConstructor
public class StripePaymentController {

    private final PaymentService paymentService;  // ← final pour être inclus dans le constructeur

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;  // ← pas final, Spring l'injecte via @Value

    // Créer un PaymentIntent pour frontend
    @PostMapping("/create-payment-intent/{contractId}")
    public Map<String, String> createPaymentIntent(@PathVariable Long contractId) throws StripeException {
        PaymentIntent intent = paymentService.createStripePaymentIntent(contractId);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());
        response.put("paymentIntentId", intent.getId());

        return response;
    }

    // Créer un PaymentIntent avec montant personnalisé
    @PostMapping("/create-payment-intent/{contractId}/amount")
    public Map<String, String> createPaymentIntentWithAmount(
            @PathVariable Long contractId,
            @RequestParam Double amount) throws StripeException {
        PaymentIntent intent = paymentService.createCustomStripePaymentIntent(contractId, amount);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());
        response.put("paymentIntentId", intent.getId());

        return response;
    }

    // Webhook Stripe
    @PostMapping("/webhook")
    public String handleWebhook(@RequestBody String payload,
                                @RequestHeader("Stripe-Signature") String sigHeader) {

        try {
            com.stripe.model.Event event = com.stripe.net.Webhook.constructEvent(payload, sigHeader, endpointSecret);

            if ("payment_intent.succeeded".equals(event.getType())) {
                PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();

                String contractIdStr = intent.getMetadata().get("contractId");
                Long contractId = contractIdStr != null ? Long.parseLong(contractIdStr) : null;

                if (contractId != null) {
                    paymentService.handleSuccessfulPayment(intent.getId(), intent.getAmount(), contractId);
                    log.info("✅ Paiement Stripe traité avec succès pour le contrat {}", contractId);
                } else {
                    log.error("❌ ContractId non trouvé dans les métadonnées");
                    paymentService.handleSuccessfulPayment(intent.getId(), intent.getAmount());
                }
            }

            return "OK";
        } catch (Exception e) {
            log.error("❌ Erreur webhook Stripe: {}", e.getMessage());
            return "Erreur: " + e.getMessage();
        }
    }
}