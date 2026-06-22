/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs */

const en_developerportal_guides_embedclaim_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tested the embed flow`)
};

const es_developerportal_guides_embedclaim_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de inserción probado`)
};

const fr_developerportal_guides_embedclaim_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux d'intégration testé`)
};

const ar_developerportal_guides_embedclaim_golive_completeditems44 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم اختبار تدفق التضمين`)
};

/**
* | output |
* | --- |
* | "Tested the embed flow" |
*
* @param {Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_golive_completeditems44 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Golive_Completeditems44Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_golive_completeditems44(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_golive_completeditems44(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_golive_completeditems44(inputs)
	return ar_developerportal_guides_embedclaim_golive_completeditems44(inputs)
});
export { developerportal_guides_embedclaim_golive_completeditems44 as "developerPortal.guides.embedClaim.goLive.completedItems4" }