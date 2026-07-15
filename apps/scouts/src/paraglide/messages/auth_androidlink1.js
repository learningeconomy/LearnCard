/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Androidlink1Inputs */

const en_auth_androidlink1 = /** @type {(inputs: Auth_Androidlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass for Android`)
};

const es_auth_androidlink1 = /** @type {(inputs: Auth_Androidlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass para Android`)
};

const fr_auth_androidlink1 = /** @type {(inputs: Auth_Androidlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass pour Android`)
};

const ar_auth_androidlink1 = /** @type {(inputs: Auth_Androidlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass for Android`)
};

/**
* | output |
* | --- |
* | "ScoutPass for Android" |
*
* @param {Auth_Androidlink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_androidlink1 = /** @type {((inputs?: Auth_Androidlink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Androidlink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_androidlink1(inputs)
	if (locale === "es") return es_auth_androidlink1(inputs)
	if (locale === "fr") return fr_auth_androidlink1(inputs)
	return ar_auth_androidlink1(inputs)
});
export { auth_androidlink1 as "auth.androidLink" }