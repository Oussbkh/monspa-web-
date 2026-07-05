"use client";

type Question = {
	key: string;
	label: string;
	type: "text" | "single_choice" | "multiple_choice" | "file";
	required: boolean;
	options?: string[];
};
export const runtime = "edge"
type Props = {
	question: Question;
	value: string | string[];
	onChange: (key: string, value: string | string[]) => void;
	onFileSelect?: (key: string, file: File) => void; // ✅ stocke le vrai File en mémoire
};

export default function DynamicField({ question, value, onChange, onFileSelect }: Props) {
	if (question.type === "text") {
		return (
			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					{question.label}
					{question.required && <span className="text-red-500"> *</span>}
				</label>
				<input
					type="text"
					required={question.required}
					value={(value as string) ?? ""}
					onChange={(e) => onChange(question.key, e.target.value)}
					className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
				/>
			</div>
		);
	}

	if (question.type === "single_choice") {
		return (
			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					{question.label}
					{question.required && <span className="text-red-500"> *</span>}
				</label>
				<div className="flex flex-col gap-2">
					{question.options?.map((option) => (
						<label key={option} className="flex items-center gap-2 text-sm text-stone-700">
							<input
								type="radio"
								name={question.key}
								required={question.required}
								checked={value === option}
								onChange={() => onChange(question.key, option)}
							/>
							{option}
						</label>
					))}
				</div>
			</div>
		);
	}

	if (question.type === "multiple_choice") {
		const selected = (value as string[]) ?? [];

		const toggle = (option: string) => {
			if (selected.includes(option)) {
				onChange(question.key, selected.filter((o) => o !== option));
			} else {
				onChange(question.key, [...selected, option]);
			}
		};

		return (
			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					{question.label}
					{question.required && <span className="text-red-500"> *</span>}
				</label>
				<div className="flex flex-col gap-2">
					{question.options?.map((option) => (
						<label key={option} className="flex items-center gap-2 text-sm text-stone-700">
							<input
								type="checkbox"
								checked={selected.includes(option)}
								onChange={() => toggle(option)}
							/>
							{option}
						</label>
					))}
				</div>
			</div>
		);
	}

	if (question.type === "file") {
		return (
			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					{question.label}
					{question.required && <span className="text-red-500"> *</span>}
				</label>
				<p className="text-xs text-stone-400 mb-2">
					Formats acceptés : JPG, PNG, WebP, PDF — max 10 Mo
				</p>
				<label className="cursor-pointer flex items-center gap-3 border-2 border-dashed border-stone-300 rounded-xl p-4 hover:border-stone-400 transition">
					<span className="text-2xl">📎</span>
					<div>
						<span className="text-sm font-medium text-stone-700">
							{(value as string) ? "Fichier sélectionné ✓" : "Cliquer pour choisir un fichier"}
						</span>
						<p className="text-xs text-stone-400 mt-0.5">
							{(value as string) || "Aucun fichier choisi"}
						</p>
					</div>
					<input
						type="file"
						accept=".jpg,.jpeg,.png,.webp,.pdf"
						required={question.required && !(value as string)}
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								onChange(question.key, file.name);     // ✅ affiche le nom dans l'UI
								onFileSelect?.(question.key, file);    // ✅ stocke le vrai File pour l'upload R2
							}
						}}
					/>
				</label>
			</div>
		);
	}

	return null;
}






// "use client";

// type Question = {
// 	key: string;
// 	label: string;
// 	type: "text" | "single_choice" | "multiple_choice" | "file";
// 	required: boolean;
// 	options?: string[];
// };

// type Props = {
// 	question: Question;
// 	value: string | string[];
// 	onChange: (key: string, value: string | string[]) => void;
// };

// export default function DynamicField({ question, value, onChange }: Props) {
// 	if (question.type === "text") {
// 		return (
// 			<div>
// 				<label className="block text-sm font-medium text-black text-stone-700 mb-1.5">
// 					{question.label}
// 					{question.required && <span className="text-red-500"> *</span>}
// 				</label>
// 				<input
// 					type="text"
// 					required={question.required}
// 					value={(value as string) ?? ""}
// 					onChange={(e) => onChange(question.key, e.target.value)}
// 					className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
// 				/>
// 			</div>
// 		);
// 	}

// 	if (question.type === "single_choice") {
// 		return (
// 			<div>
// 				<label className="block text-sm font-medium text-black text-stone-700 mb-1.5">
// 					{question.label}
// 					{question.required && <span className="text-red-500"> *</span>}
// 				</label>
// 				<div className="flex flex-col gap-2">
// 					{question.options?.map((option) => (
// 						<label key={option} className="flex items-center gap-2 text-sm text-stone-700">
// 							<input
// 								type="radio"
// 								name={question.key}
// 								required={question.required}
// 								checked={value === option}
// 								onChange={() => onChange(question.key, option)}
// 							/>
// 							{option}
// 						</label>
// 					))}
// 				</div>
// 			</div>
// 		);
// 	}

// 	if (question.type === "multiple_choice") {
// 		const selected = (value as string[]) ?? [];

// 		const toggle = (option: string) => {
// 			if (selected.includes(option)) {
// 				onChange(question.key, selected.filter((o) => o !== option));
// 			} else {
// 				onChange(question.key, [...selected, option]);
// 			}
// 		};

// 		return (
// 			<div>
// 				<label className="block text-sm font-medium text-stone-700 mb-1.5">
// 					{question.label}
// 					{question.required && <span className="text-red-500"> *</span>}
// 				</label>
// 				<div className="flex flex-col gap-2">
// 					{question.options?.map((option) => (
// 						<label key={option} className="flex items-center gap-2 text-sm text-stone-700">
// 							<input
// 								type="checkbox"
// 								checked={selected.includes(option)}
// 								onChange={() => toggle(option)}
// 							/>
// 							{option}
// 						</label>
// 					))}
// 				</div>
// 			</div>
// 		);
// 	}

// 	if (question.type === "file") {
// 		return (
// 			<div>
// 				<label className="block text-sm font-medium text-stone-700 mb-1.5">
// 					{question.label}
// 					{question.required && <span className="text-red-500"> *</span>}
// 				</label>
// 				<p className="text-xs text-stone-400 mb-2">
// 					Formats acceptés : JPG, PNG, WebP, PDF — max 10 Mo
// 				</p>
// 				<label className="cursor-pointer flex items-center gap-3 border-2 border-dashed border-stone-300 rounded-xl p-4 hover:border-stone-400 transition">
// 					<span className="text-2xl">📎</span>
// 					<div>
// 						<span className="text-sm font-medium text-stone-700">
// 							{(value as string) ? "Fichier sélectionné ✓" : "Cliquer pour choisir un fichier"}
// 						</span>
// 						<p className="text-xs text-stone-400 mt-0.5">
// 							{(value as string) || "Aucun fichier choisi"}
// 						</p>
// 					</div>
// 					<input
// 						type="file"
// 						accept=".jpg,.jpeg,.png,.webp,.pdf"
// 						data-key={question.key}  // ✅ attribut pour identifier l'input
// 						required={question.required && !(value as string)}
// 						className="hidden"
// 						onChange={(e) => {
// 							const file = e.target.files?.[0];
// 							if (file) onChange(question.key, file.name);
// 						}}
// 					/>
// 				</label>
// 			</div>
// 		);
// 	}

// 	return null;
// }