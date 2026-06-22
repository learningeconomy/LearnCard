/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Requestaccess2Inputs */

const en_developerportal_guides_hub_requestaccess2 = /** @type {(inputs: Developerportal_Guides_Hub_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Access`)
};

const es_developerportal_guides_hub_requestaccess2 = /** @type {(inputs: Developerportal_Guides_Hub_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Acceso`)
};

const fr_developerportal_guides_hub_requestaccess2 = /** @type {(inputs: Developerportal_Guides_Hub_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander l'Accès`)
};

const ar_developerportal_guides_hub_requestaccess2 = /** @type {(inputs: Developerportal_Guides_Hub_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الوصول`)
};

/**
* | output |
* | --- |
* | "Request Access" |
*
* @param {Developerportal_Guides_Hub_Requestaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_requestaccess2 = /** @type {((inputs?: Developerportal_Guides_Hub_Requestaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Requestaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_requestaccess2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_requestaccess2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_requestaccess2(inputs)
	return ar_developerportal_guides_hub_requestaccess2(inputs)
});
export { developerportal_guides_hub_requestaccess2 as "developerPortal.guides.hub.requestAccess" }