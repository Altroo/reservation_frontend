import {
	genderItemsList,
} from './rawData';

describe('items lists', () => {
	describe('genderItemsList', () => {
		it('has two entries with correct codes and values', () => {
			expect(genderItemsList).toHaveLength(2);

			expect(genderItemsList[0]).toEqual({ code: 'H', value: 'Homme' });
			expect(genderItemsList[1]).toEqual({ code: 'F', value: 'Femme' });

			const codes = genderItemsList.map((i) => i.code);
			expect(codes).toEqual(['H', 'F']);

			const values = genderItemsList.map((i) => i.value);
			expect(values).toEqual(['Homme', 'Femme']);
		});

		it('contains unique codes', () => {
			const codes = genderItemsList.map((i) => i.code);
			const unique = Array.from(new Set(codes));
			expect(unique).toHaveLength(codes.length);
		});
	});
});
