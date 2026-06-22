/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Sharedcomputer1Inputs */

const en_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Shared or public computer`)
};

const es_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Computadora compartida o pública`)
};

const fr_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ordinateur partagé ou public`)
};

const ar_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كمبيوتر مشترك أو عام`)
};

/**
* | output |
* | --- |
* | "Shared or public computer" |
*
* @param {Login_Sharedcomputer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_sharedcomputer1 = /** @type {((inputs?: Login_Sharedcomputer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Sharedcomputer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_sharedcomputer1(inputs)
	if (locale === "es") return es_login_sharedcomputer1(inputs)
	if (locale === "fr") return fr_login_sharedcomputer1(inputs)
	return ar_login_sharedcomputer1(inputs)
});
export { login_sharedcomputer1 as "login.sharedComputer" }