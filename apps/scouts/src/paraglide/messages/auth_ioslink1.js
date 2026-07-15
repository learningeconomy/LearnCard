/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Ioslink1Inputs */

const en_auth_ioslink1 = /** @type {(inputs: Auth_Ioslink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass for iOS`)
};

const es_auth_ioslink1 = /** @type {(inputs: Auth_Ioslink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass para iOS`)
};

const fr_auth_ioslink1 = /** @type {(inputs: Auth_Ioslink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass pour iOS`)
};

const ar_auth_ioslink1 = /** @type {(inputs: Auth_Ioslink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass for iOS`)
};

/**
* | output |
* | --- |
* | "ScoutPass for iOS" |
*
* @param {Auth_Ioslink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_ioslink1 = /** @type {((inputs?: Auth_Ioslink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Ioslink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_ioslink1(inputs)
	if (locale === "es") return es_auth_ioslink1(inputs)
	if (locale === "fr") return fr_auth_ioslink1(inputs)
	return ar_auth_ioslink1(inputs)
});
export { auth_ioslink1 as "auth.iosLink" }