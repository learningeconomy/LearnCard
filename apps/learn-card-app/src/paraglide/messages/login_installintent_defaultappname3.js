/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Installintent_Defaultappname3Inputs */

const en_login_installintent_defaultappname3 = /** @type {(inputs: Login_Installintent_Defaultappname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`the app`)
};

const es_login_installintent_defaultappname3 = /** @type {(inputs: Login_Installintent_Defaultappname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`la aplicación`)
};

const fr_login_installintent_defaultappname3 = /** @type {(inputs: Login_Installintent_Defaultappname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`l'application`)
};

const ar_login_installintent_defaultappname3 = /** @type {(inputs: Login_Installintent_Defaultappname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التطبيق`)
};

/**
* | output |
* | --- |
* | "the app" |
*
* @param {Login_Installintent_Defaultappname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_installintent_defaultappname3 = /** @type {((inputs?: Login_Installintent_Defaultappname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Installintent_Defaultappname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_installintent_defaultappname3(inputs)
	if (locale === "es") return es_login_installintent_defaultappname3(inputs)
	if (locale === "fr") return fr_login_installintent_defaultappname3(inputs)
	return ar_login_installintent_defaultappname3(inputs)
});
export { login_installintent_defaultappname3 as "login.installIntent.defaultAppName" }