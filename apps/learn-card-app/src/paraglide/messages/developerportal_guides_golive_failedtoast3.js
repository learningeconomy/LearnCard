/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Failedtoast3Inputs */

const en_developerportal_guides_golive_failedtoast3 = /** @type {(inputs: Developerportal_Guides_Golive_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to activate integration. Please try again.`)
};

const es_developerportal_guides_golive_failedtoast3 = /** @type {(inputs: Developerportal_Guides_Golive_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al activar la integración. Por favor, inténtalo de nuevo.`)
};

const fr_developerportal_guides_golive_failedtoast3 = /** @type {(inputs: Developerportal_Guides_Golive_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'activation de l'intégration. Veuillez réessayer.`)
};

const ar_developerportal_guides_golive_failedtoast3 = /** @type {(inputs: Developerportal_Guides_Golive_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل في تفعيل التكامل. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to activate integration. Please try again." |
*
* @param {Developerportal_Guides_Golive_Failedtoast3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_failedtoast3 = /** @type {((inputs?: Developerportal_Guides_Golive_Failedtoast3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Failedtoast3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_failedtoast3(inputs)
	if (locale === "es") return es_developerportal_guides_golive_failedtoast3(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_failedtoast3(inputs)
	return ar_developerportal_guides_golive_failedtoast3(inputs)
});
export { developerportal_guides_golive_failedtoast3 as "developerPortal.guides.goLive.failedToast" }