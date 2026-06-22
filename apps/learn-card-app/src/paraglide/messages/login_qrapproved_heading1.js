/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Qrapproved_Heading1Inputs */

const en_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're all set!`)
};

const es_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Todo listo!`)
};

const fr_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes prêt !`)
};

const ar_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت جاهز!`)
};

/**
* | output |
* | --- |
* | "You're all set!" |
*
* @param {Login_Qrapproved_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_qrapproved_heading1 = /** @type {((inputs?: Login_Qrapproved_Heading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Qrapproved_Heading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_qrapproved_heading1(inputs)
	if (locale === "es") return es_login_qrapproved_heading1(inputs)
	if (locale === "fr") return fr_login_qrapproved_heading1(inputs)
	return ar_login_qrapproved_heading1(inputs)
});
export { login_qrapproved_heading1 as "login.qrApproved.heading" }