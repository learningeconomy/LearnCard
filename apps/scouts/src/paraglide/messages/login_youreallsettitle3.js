/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Youreallsettitle3Inputs */

const en_login_youreallsettitle3 = /** @type {(inputs: Login_Youreallsettitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're all set!`)
};

const es_login_youreallsettitle3 = /** @type {(inputs: Login_Youreallsettitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Todo listo!`)
};

const fr_login_youreallsettitle3 = /** @type {(inputs: Login_Youreallsettitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout est prêt !`)
};

const ar_login_youreallsettitle3 = /** @type {(inputs: Login_Youreallsettitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كل شيء جاهز!`)
};

/**
* | output |
* | --- |
* | "You're all set!" |
*
* @param {Login_Youreallsettitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_youreallsettitle3 = /** @type {((inputs?: Login_Youreallsettitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Youreallsettitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_youreallsettitle3(inputs)
	if (locale === "es") return es_login_youreallsettitle3(inputs)
	if (locale === "fr") return fr_login_youreallsettitle3(inputs)
	return ar_login_youreallsettitle3(inputs)
});
export { login_youreallsettitle3 as "login.youreAllSetTitle" }