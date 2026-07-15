/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Learnmorescoutpass3Inputs */

const en_login_learnmorescoutpass3 = /** @type {(inputs: Login_Learnmorescoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learn More about ScoutPass`)
};

const es_login_learnmorescoutpass3 = /** @type {(inputs: Login_Learnmorescoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Más Información sobre ScoutPass`)
};

const fr_login_learnmorescoutpass3 = /** @type {(inputs: Login_Learnmorescoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En savoir plus sur ScoutPass`)
};

const ar_login_learnmorescoutpass3 = /** @type {(inputs: Login_Learnmorescoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اعرف المزيد عن ScoutPass`)
};

/**
* | output |
* | --- |
* | "Learn More about ScoutPass" |
*
* @param {Login_Learnmorescoutpass3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_learnmorescoutpass3 = /** @type {((inputs?: Login_Learnmorescoutpass3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Learnmorescoutpass3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_learnmorescoutpass3(inputs)
	if (locale === "es") return es_login_learnmorescoutpass3(inputs)
	if (locale === "fr") return fr_login_learnmorescoutpass3(inputs)
	return ar_login_learnmorescoutpass3(inputs)
});
export { login_learnmorescoutpass3 as "login.learnMoreScoutPass" }