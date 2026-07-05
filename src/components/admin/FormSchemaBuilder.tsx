"use client";

type Question = {
	key: string;
	label: string;
	type: "text" | "single_choice" | "multiple_choice"| "file";  // ✅ AJOUT
	required: boolean;
	options?: string[];
};

type Props = {
	questions: Question[];
	onChange: (questions: Question[]) => void;
};

function slugifyKey(label: string, existingKeys: string[]): string {
	let base = label
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

	if (!base) base = "question";

	let key = base;
	let i = 1;
	while (existingKeys.includes(key)) {
		key = `${base}_${i}`;
		i++;
	}
	return key;
}

export default function FormSchemaBuilder({ questions, onChange }: Props) {
	const addQuestion = () => {
		const key = slugifyKey("nouvelle_question", questions.map((q) => q.key));
		onChange([...questions, { key, label: "", type: "text", required: false }]);
	};

	const updateQuestion = (index: number, updates: Partial<Question>) => {
		const next = [...questions];
		next[index] = { ...next[index], ...updates };
		onChange(next);
	};

	const updateLabel = (index: number, label: string) => {
		const current = questions[index];
		const otherKeys = questions.filter((_, i) => i !== index).map((q) => q.key);
		const key = current.label === "" ? slugifyKey(label, otherKeys) : current.key;
		updateQuestion(index, { label, key });
	};

	const removeQuestion = (index: number) => {
		onChange(questions.filter((_, i) => i !== index));
	};

	const updateOption = (qIndex: number, oIndex: number, value: string) => {
		const options = [...(questions[qIndex].options ?? [])];
		options[oIndex] = value;
		updateQuestion(qIndex, { options });
	};

	const addOption = (qIndex: number) => {
		updateQuestion(qIndex, { options: [...(questions[qIndex].options ?? []), ""] });
	};

	const removeOption = (qIndex: number, oIndex: number) => {
		updateQuestion(qIndex, {
			options: (questions[qIndex].options ?? []).filter((_, i) => i !== oIndex),
		});
	};

	return (
		<div className="flex flex-col gap-4">
			{questions.map((question, index) => (
				<div key={index} className="border border-stone-200 rounded-xl p-4 bg-stone-50">
					<div className="flex gap-3">
						<div className="flex-1">
							<label className="block text-xs text-stone-500 mb-1">Question</label>
							<input
								type="text"
								value={question.label}
								onChange={(e) => updateLabel(index, e.target.value)}
								placeholder="Ex: Quel est votre type de peau ?"
								className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
							/>
						</div>

						<div>
							<label className="block text-xs text-stone-500 mb-1">Type</label>
							<select
								value={question.type}
								onChange={(e) =>
									updateQuestion(index, {
										type: e.target.value as Question["type"],
										options:
											e.target.value === "text" || e.target.value === "file"
												? undefined
												: question.options ?? [""],
									})
								}
								className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
							>
								<option value="text">Texte libre</option>
								<option value="single_choice">Choix simple</option>
								<option value="multiple_choice">Choix multiple</option>
								<option value="file">Fichier / Image / PDF</option>  {/* ✅ AJOUT */}
							</select>
						</div>
					</div>

					{(question.type === "single_choice" || question.type === "multiple_choice") && (
						<div className="mt-3">
							<label className="block text-xs text-stone-500 mb-1">Options</label>
							<div className="flex flex-col gap-2">
								{(question.options ?? []).map((option, oIndex) => (
									<div key={oIndex} className="flex gap-2">
										<input
											type="text"
											value={option}
											onChange={(e) => updateOption(index, oIndex, e.target.value)}
											placeholder={`Option ${oIndex + 1}`}
											className="flex-1 border border-stone-300 rounded-lg px-3 py-1.5 text-black text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
										/>
										<button
											type="button"
											onClick={() => removeOption(index, oIndex)}
											className="text-stone-400 hover:text-red-600 text-sm px-2"
										>
											Supprimer
										</button>
									</div>
								))}
							</div>
							<button
								type="button"
								onClick={() => addOption(index)}
								className="text-sm text-stone-600 hover:text-stone-900 mt-2"
							>
								+ Ajouter une option
							</button>
						</div>
					)}

					<div className="flex items-center justify-between mt-3">
						<label className="flex items-center gap-2 text-sm text-stone-600">
							<input
								type="checkbox"
								checked={question.required}
								onChange={(e) => updateQuestion(index, { required: e.target.checked })}
							/>
							Obligatoire
						</label>

						<button
							type="button"
							onClick={() => removeQuestion(index)}
							className="text-sm text-red-600 hover:text-red-700"
						>
							Supprimer cette question
						</button>
					</div>
				</div>
			))}

			<button
				type="button"
				onClick={addQuestion}
				className="text-sm font-medium text-stone-900 border border-stone-300 rounded-lg px-4 py-2 hover:bg-stone-50 transition self-start"
			>
				+ Ajouter une question
			</button>
		</div>
	);
}