/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs */

const en_developerportal_guides_embedclaim_genericfailedtoast4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to copy key.`)
};

const es_developerportal_guides_embedclaim_genericfailedtoast4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al copiar la clave.`)
};

const fr_developerportal_guides_embedclaim_genericfailedtoast4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la copie de la clé.`)
};

const ar_developerportal_guides_embedclaim_genericfailedtoast4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل نسخ المفتاح.`)
};

/**
* | output |
* | --- |
* | "Failed to copy key." |
*
* @param {Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_genericfailedtoast4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Genericfailedtoast4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_genericfailedtoast4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_genericfailedtoast4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_genericfailedtoast4(inputs)
	return ar_developerportal_guides_embedclaim_genericfailedtoast4(inputs)
});
export { developerportal_guides_embedclaim_genericfailedtoast4 as "developerPortal.guides.embedClaim.genericFailedToast" }