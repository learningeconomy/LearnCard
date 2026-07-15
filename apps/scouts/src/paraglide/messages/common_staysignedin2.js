/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Staysignedin2Inputs */

const en_common_staysignedin2 = /** @type {(inputs: Common_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stay Signed In`)
};

const es_common_staysignedin2 = /** @type {(inputs: Common_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permanecer conectado`)
};

const fr_common_staysignedin2 = /** @type {(inputs: Common_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rester connecté`)
};

const ar_common_staysignedin2 = /** @type {(inputs: Common_Staysignedin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البقاء مسجلاً`)
};

/**
* | output |
* | --- |
* | "Stay Signed In" |
*
* @param {Common_Staysignedin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_staysignedin2 = /** @type {((inputs?: Common_Staysignedin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Staysignedin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_staysignedin2(inputs)
	if (locale === "es") return es_common_staysignedin2(inputs)
	if (locale === "fr") return fr_common_staysignedin2(inputs)
	return ar_common_staysignedin2(inputs)
});
export { common_staysignedin2 as "common.staySignedIn" }