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

const de_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Freigegebener oder öffentlicher Computer`)
};

const ar_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كمبيوتر مشترك أو عام`)
};

const fr_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ordinateur partagé ou public`)
};

const ko_login_sharedcomputer1 = /** @type {(inputs: Login_Sharedcomputer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공유 또는 공용 컴퓨터`)
};

/**
* | output |
* | --- |
* | "Shared or public computer" |
*
* @param {Login_Sharedcomputer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_sharedcomputer1 = /** @type {((inputs?: Login_Sharedcomputer1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Sharedcomputer1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_sharedcomputer1(inputs)
	if (locale === "es") return es_login_sharedcomputer1(inputs)
	if (locale === "de") return de_login_sharedcomputer1(inputs)
	if (locale === "ar") return ar_login_sharedcomputer1(inputs)
	if (locale === "fr") return fr_login_sharedcomputer1(inputs)
	return ko_login_sharedcomputer1(inputs)
});
export { login_sharedcomputer1 as "login.sharedComputer" }