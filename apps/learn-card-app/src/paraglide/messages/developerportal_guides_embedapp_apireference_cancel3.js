/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs */

const en_developerportal_guides_embedapp_apireference_cancel3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_developerportal_guides_embedapp_apireference_cancel3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const fr_developerportal_guides_embedapp_apireference_cancel3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ar_developerportal_guides_embedapp_apireference_cancel3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_cancel3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Cancel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_cancel3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_cancel3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_cancel3(inputs)
	return ar_developerportal_guides_embedapp_apireference_cancel3(inputs)
});
export { developerportal_guides_embedapp_apireference_cancel3 as "developerPortal.guides.embedApp.apiReference.cancel" }