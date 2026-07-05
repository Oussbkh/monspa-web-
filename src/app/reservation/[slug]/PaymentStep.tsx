"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type Props = {
	onConfirmed: (paymentIntentId: string) => Promise<{ success: boolean; error?: string }>;
};

export default function PaymentStep({ onConfirmed }: Props) {
	const stripe = useStripe();
	const elements = useElements();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) return;

		setLoading(true);
		setError(null);

		const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
			elements,
			redirect: "if_required",
		});

		if (confirmError) {
			setError(confirmError.message ?? "Le paiement a échoué");
			setLoading(false);
			return;
		}

		if (!paymentIntent) {
			setError("Le paiement n'a pas pu être confirmé");
			setLoading(false);
			return;
		}

		const result = await onConfirmed(paymentIntent.id);

		if (!result.success) {
			setError(result.error ?? "Erreur lors de la confirmation de la réservation");
			setLoading(false);
			return;
		}

		setSuccess(true);
		setLoading(false);
	};

	if (success) {
		return (
			<div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
				<h2 className="text-xl font-semibold text-stone-900">Demande envoyée</h2>
				<p className="text-stone-500 mt-2">
					Votre paiement est autorisé. Vous recevrez une confirmation dès que l&apos;administrateur
					aura validé votre créneau.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<PaymentElement />

			{error && <p className="text-red-600 text-sm">{error}</p>}

			<button
				type="submit"
				disabled={!stripe || loading}
				className="bg-stone-900 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50"
			>
				{loading ? "Paiement en cours..." : "Confirmer le paiement"}
			</button>
		</form>
	);
}