/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Termsofservice2Inputs */

const en_launchpad_detail_termsofservice2 = /** @type {(inputs: Launchpad_Detail_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_launchpad_detail_termsofservice2 = /** @type {(inputs: Launchpad_Detail_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos de servicio`)
};

const fr_launchpad_detail_termsofservice2 = /** @type {(inputs: Launchpad_Detail_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'utilisation`)
};

const ar_launchpad_detail_termsofservice2 = /** @type {(inputs: Launchpad_Detail_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Launchpad_Detail_Termsofservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_termsofservice2 = /** @type {((inputs?: Launchpad_Detail_Termsofservice2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Termsofservice2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_termsofservice2(inputs)
	if (locale === "es") return es_launchpad_detail_termsofservice2(inputs)
	if (locale === "fr") return fr_launchpad_detail_termsofservice2(inputs)
	return ar_launchpad_detail_termsofservice2(inputs)
});
export { launchpad_detail_termsofservice2 as "launchpad.detail.termsOfService" }