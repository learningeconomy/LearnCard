/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ version: NonNullable<unknown> }} Auth_Curversion1Inputs */

const en_auth_curversion1 = /** @type {(inputs: Auth_Curversion1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Current Version: ${i?.version}`)
};

const es_auth_curversion1 = /** @type {(inputs: Auth_Curversion1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Versión Actual: ${i?.version}`)
};

const fr_auth_curversion1 = /** @type {(inputs: Auth_Curversion1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Version actuelle : ${i?.version}`)
};

const ar_auth_curversion1 = /** @type {(inputs: Auth_Curversion1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الإصدار الحالي: ${i?.version}`)
};

/**
* | output |
* | --- |
* | "Current Version: {version}" |
*
* @param {Auth_Curversion1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_curversion1 = /** @type {((inputs: Auth_Curversion1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Curversion1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_curversion1(inputs)
	if (locale === "es") return es_auth_curversion1(inputs)
	if (locale === "fr") return fr_auth_curversion1(inputs)
	return ar_auth_curversion1(inputs)
});
export { auth_curversion1 as "auth.curVersion" }