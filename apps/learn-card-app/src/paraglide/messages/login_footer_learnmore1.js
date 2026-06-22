/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Footer_Learnmore1Inputs */

const en_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learn More`)
};

const es_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Más información`)
};

const fr_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En savoir plus`)
};

const ar_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرفة المزيد`)
};

/**
* | output |
* | --- |
* | "Learn More" |
*
* @param {Login_Footer_Learnmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_footer_learnmore1 = /** @type {((inputs?: Login_Footer_Learnmore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_Learnmore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_learnmore1(inputs)
	if (locale === "es") return es_login_footer_learnmore1(inputs)
	if (locale === "fr") return fr_login_footer_learnmore1(inputs)
	return ar_login_footer_learnmore1(inputs)
});
export { login_footer_learnmore1 as "login.footer.learnMore" }