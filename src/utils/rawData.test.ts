import {
	genderItemsList,
	typeLocalItemsList,
	TYPE_LOCAL_CHIP_COLORS,
	LOCAL_FIELD_LABELS,
	LOYER_FIELD_LABELS,
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

	describe('typeLocalItemsList', () => {
		it('has two entries with correct codes and values', () => {
			expect(typeLocalItemsList).toHaveLength(2);
			expect(typeLocalItemsList[0]).toEqual({ code: 'Bureau', value: 'Bureau' });
			expect(typeLocalItemsList[1]).toEqual({ code: 'Magasin', value: 'Magasin' });
		});

		it('contains unique codes', () => {
			const codes = typeLocalItemsList.map((i) => i.code);
			const unique = Array.from(new Set(codes));
			expect(unique).toHaveLength(codes.length);
		});
	});

	describe('TYPE_LOCAL_CHIP_COLORS', () => {
		it('maps Bureau to primary and Magasin to warning', () => {
			expect(TYPE_LOCAL_CHIP_COLORS['Bureau']).toBe('primary');
			expect(TYPE_LOCAL_CHIP_COLORS['Magasin']).toBe('warning');
		});

		it('has entries for each typeLocalItemsList code', () => {
			for (const item of typeLocalItemsList) {
				expect(TYPE_LOCAL_CHIP_COLORS[item.code]).toBeDefined();
			}
		});
	});

	describe('LOCAL_FIELD_LABELS', () => {
		it('has 10 field labels', () => {
			expect(Object.keys(LOCAL_FIELD_LABELS)).toHaveLength(10);
		});

		it('maps expected field keys to French labels', () => {
			expect(LOCAL_FIELD_LABELS['nom']).toBe('Nom');
			expect(LOCAL_FIELD_LABELS['type_local']).toBe('Type');
			expect(LOCAL_FIELD_LABELS['adresse']).toBe('Adresse');
			expect(LOCAL_FIELD_LABELS['superficie']).toBe('Superficie');
			expect(LOCAL_FIELD_LABELS['prix_achat']).toBe("Prix d'achat");
			expect(LOCAL_FIELD_LABELS['prix_location_mensuel']).toBe('Loyer mensuel');
			expect(LOCAL_FIELD_LABELS['en_location']).toBe('En location');
			expect(LOCAL_FIELD_LABELS['locataire_nom']).toBe('Locataire');
			expect(LOCAL_FIELD_LABELS['date_debut_location']).toBe('Début de location');
			expect(LOCAL_FIELD_LABELS['notes']).toBe('Notes');
		});
	});

	describe('LOYER_FIELD_LABELS', () => {
		it('has 7 field labels', () => {
			expect(Object.keys(LOYER_FIELD_LABELS)).toHaveLength(7);
		});

		it('maps expected field keys to French labels', () => {
			expect(LOYER_FIELD_LABELS['local']).toBe('Local');
			expect(LOYER_FIELD_LABELS['mois']).toBe('Mois');
			expect(LOYER_FIELD_LABELS['annee']).toBe('Année');
			expect(LOYER_FIELD_LABELS['montant']).toBe('Montant');
			expect(LOYER_FIELD_LABELS['paye']).toBe('Payé');
			expect(LOYER_FIELD_LABELS['date_paiement']).toBe('Date de paiement');
			expect(LOYER_FIELD_LABELS['notes']).toBe('Notes');
		});
	});
});
