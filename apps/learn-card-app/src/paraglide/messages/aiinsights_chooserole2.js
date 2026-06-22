/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Chooserole2Inputs */

const en_aiinsights_chooserole2 = /** @type {(inputs: Aiinsights_Chooserole2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose role`)
};

const es_aiinsights_chooserole2 = /** @type {(inputs: Aiinsights_Chooserole2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elegir rol`)
};

const fr_aiinsights_chooserole2 = /** @type {(inputs: Aiinsights_Chooserole2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisir un rôle`)
};

const ar_aiinsights_chooserole2 = /** @type {(inputs: Aiinsights_Chooserole2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر دورًا`)
};

/**
* | output |
* | --- |
* | "Choose role" |
*
* @param {Aiinsights_Chooserole2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_chooserole2 = /** @type {((inputs?: Aiinsights_Chooserole2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Chooserole2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_chooserole2(inputs)
	if (locale === "es") return es_aiinsights_chooserole2(inputs)
	if (locale === "fr") return fr_aiinsights_chooserole2(inputs)
	return ar_aiinsights_chooserole2(inputs)
});
export { aiinsights_chooserole2 as "aiInsights.chooseRole" }