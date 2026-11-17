import { waitForSavedTranslations } from './pdfTranslations';

afterEach(() => jest.useRealTimers());
it('returns cached translations immediately', async () => {
	const request = jest.fn().mockResolvedValue({ translations: ['Cleaning'] });
	expect(await waitForSavedTranslations(request)).toEqual({ translations: ['Cleaning'] });
	expect(request).toHaveBeenCalledTimes(1);
});
it('waits for queued translations and preserves their line breaks', async () => {
	jest.useFakeTimers();
	const request = jest
		.fn()
		.mockRejectedValueOnce({ status: 409, data: { details: { code: 'pdf_translation_pending' } } })
		.mockResolvedValue({ translations: ['• Cleaning.\n  • Check.'] });
	const result = waitForSavedTranslations(request);
	await jest.advanceTimersByTimeAsync(2000);
	expect(await result).toEqual({ translations: ['• Cleaning.\n  • Check.'] });
});
it('stops a quota wait immediately as a typed informational result', async () => {
	const request = jest.fn().mockRejectedValue({ status: 409, data: { details: { code: 'pdf_translation_deferred' } } });
	await expect(waitForSavedTranslations(request)).rejects.toMatchObject({ name: 'PdfTranslationDeferredError' });
	expect(request).toHaveBeenCalledTimes(1);
});
it('bounds the whole print preparation wait', async () => {
	jest.useFakeTimers();
	const request = jest.fn().mockRejectedValue({ status: 409, data: { details: { code: 'pdf_translation_pending' } } });
	const result = waitForSavedTranslations(request).catch((error) => error.name);
	await jest.advanceTimersByTimeAsync(180000);
	expect(await result).toBe('PdfTranslationDeferredError');
});
it('does not hide an actual network failure', async () => {
	const failure = { status: 503, data: { message: 'Unavailable' } };
	await expect(waitForSavedTranslations(jest.fn().mockRejectedValue(failure))).rejects.toBe(failure);
});
