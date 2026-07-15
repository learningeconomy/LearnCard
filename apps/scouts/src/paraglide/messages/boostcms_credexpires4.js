/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Credexpires4Inputs */

const en_boostcms_credexpires4 = /** @type {(inputs: Boostcms_Credexpires4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Expires`)
};

const es_boostcms_credexpires4 = /** @type {(inputs: Boostcms_Credexpires4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La Credencial Expira`)
};

const fr_boostcms_credexpires4 = /** @type {(inputs: Boostcms_Credexpires4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le justificatif expire`)
};

const ar_boostcms_credexpires4 = /** @type {(inputs: Boostcms_Credexpires4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Expires`)
};

/**
* | output |
* | --- |
* | "Credential Expires" |
*
* @param {Boostcms_Credexpires4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_credexpires4 = /** @type {((inputs?: Boostcms_Credexpires4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Credexpires4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_credexpires4(inputs)
	if (locale === "es") return es_boostcms_credexpires4(inputs)
	if (locale === "fr") return fr_boostcms_credexpires4(inputs)
	return ar_boostcms_credexpires4(inputs)
});
export { boostcms_credexpires4 as "boostCMS.credExpires" }