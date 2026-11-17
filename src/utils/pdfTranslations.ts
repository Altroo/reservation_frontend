import { PdfTranslationDeferredError } from './pdfErrors';

export const waitForSavedTranslations = async (
	request: () => Promise<{ translations: string[] }>,
	deadline = Date.now() + 180_000,
): Promise<{ translations: string[] }> => {
	for (;;) {
		try {
			return await request();
		} catch (error) {
			const value = error as { status?: number; data?: { code?: string; details?: { code?: string } } };
			const code = value.data?.details?.code ?? value.data?.code;
			if (
				value.status === 409 &&
				(code === 'pdf_translation_deferred' || (code === 'pdf_translation_pending' && Date.now() + 2000 >= deadline))
			)
				throw new PdfTranslationDeferredError();
			if (value.status !== 409 || code !== 'pdf_translation_pending') throw error;
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
};

/** Share one bounded preparation window across every batch in a print action. */
export const createSavedTranslationsReader = () => {
	const deadline = Date.now() + 180_000;
	return (request: () => Promise<{ translations: string[] }>) => waitForSavedTranslations(request, deadline);
};
