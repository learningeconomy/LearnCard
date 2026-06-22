/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Nointegrationtoast4Inputs */

const en_developerportal_guides_golive_nointegrationtoast4 = /** @type {(inputs: Developerportal_Guides_Golive_Nointegrationtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No integration selected`)
};

const es_developerportal_guides_golive_nointegrationtoast4 = /** @type {(inputs: Developerportal_Guides_Golive_Nointegrationtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se seleccionó ninguna integración`)
};

const fr_developerportal_guides_golive_nointegrationtoast4 = /** @type {(inputs: Developerportal_Guides_Golive_Nointegrationtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune intégration sélectionnée`)
};

const ar_developerportal_guides_golive_nointegrationtoast4 = /** @type {(inputs: Developerportal_Guides_Golive_Nointegrationtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تحديد أي تكامل`)
};

/**
* | output |
* | --- |
* | "No integration selected" |
*
* @param {Developerportal_Guides_Golive_Nointegrationtoast4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_nointegrationtoast4 = /** @type {((inputs?: Developerportal_Guides_Golive_Nointegrationtoast4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Nointegrationtoast4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_nointegrationtoast4(inputs)
	if (locale === "es") return es_developerportal_guides_golive_nointegrationtoast4(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_nointegrationtoast4(inputs)
	return ar_developerportal_guides_golive_nointegrationtoast4(inputs)
});
export { developerportal_guides_golive_nointegrationtoast4 as "developerPortal.guides.goLive.noIntegrationToast" }