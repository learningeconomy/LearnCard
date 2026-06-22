/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs */

const en_developerportal_guides_embedclaim_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieved publishable key`)
};

const es_developerportal_guides_embedclaim_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave pública obtenida`)
};

const fr_developerportal_guides_embedclaim_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé publique récupérée`)
};

const ar_developerportal_guides_embedclaim_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم استرداد المفتاح العام`)
};

/**
* | output |
* | --- |
* | "Retrieved publishable key" |
*
* @param {Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_golive_completeditems04 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Golive_Completeditems04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_golive_completeditems04(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_golive_completeditems04(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_golive_completeditems04(inputs)
	return ar_developerportal_guides_embedclaim_golive_completeditems04(inputs)
});
export { developerportal_guides_embedclaim_golive_completeditems04 as "developerPortal.guides.embedClaim.goLive.completedItems0" }