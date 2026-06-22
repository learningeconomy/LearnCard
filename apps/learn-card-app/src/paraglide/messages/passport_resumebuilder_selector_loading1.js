/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Selector_Loading1Inputs */

const en_passport_resumebuilder_selector_loading1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading credentials...`)
};

const es_passport_resumebuilder_selector_loading1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando credenciales...`)
};

const fr_passport_resumebuilder_selector_loading1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des titres...`)
};

const ar_passport_resumebuilder_selector_loading1 = /** @type {(inputs: Passport_Resumebuilder_Selector_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل الشهادات...`)
};

/**
* | output |
* | --- |
* | "Loading credentials..." |
*
* @param {Passport_Resumebuilder_Selector_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_selector_loading1 = /** @type {((inputs?: Passport_Resumebuilder_Selector_Loading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Selector_Loading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_selector_loading1(inputs)
	if (locale === "es") return es_passport_resumebuilder_selector_loading1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_selector_loading1(inputs)
	return ar_passport_resumebuilder_selector_loading1(inputs)
});
export { passport_resumebuilder_selector_loading1 as "passport.resumeBuilder.selector.loading" }