// Only reviewed writing fields get AI. Unknown fields stay unchanged by default.
const writingFields = new Set(['description', 'notes', 'cost_period_label']);

export const isAiTextField = (name: string, type: string) =>
	(type === 'text' || type === 'textarea') && writingFields.has(name);
