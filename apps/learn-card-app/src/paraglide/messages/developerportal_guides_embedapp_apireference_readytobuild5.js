/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs */

const en_developerportal_guides_embedapp_apireference_readytobuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to build!`)
};

const es_developerportal_guides_embedapp_apireference_readytobuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Listo para construir!`)
};

const fr_developerportal_guides_embedapp_apireference_readytobuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à construire !`)
};

const ar_developerportal_guides_embedapp_apireference_readytobuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز للبناء!`)
};

/**
* | output |
* | --- |
* | "Ready to build!" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_readytobuild5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Readytobuild5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_readytobuild5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_readytobuild5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_readytobuild5(inputs)
	return ar_developerportal_guides_embedapp_apireference_readytobuild5(inputs)
});
export { developerportal_guides_embedapp_apireference_readytobuild5 as "developerPortal.guides.embedApp.apiReference.readyToBuild" }