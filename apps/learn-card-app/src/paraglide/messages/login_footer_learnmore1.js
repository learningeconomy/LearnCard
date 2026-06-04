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

const de_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mehr erfahren`)
};

const ar_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرفة المزيد`)
};

const fr_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En savoir plus`)
};

const ko_login_footer_learnmore1 = /** @type {(inputs: Login_Footer_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`더 알아보기`)
};

/**
* | output |
* | --- |
* | "Learn More" |
*
* @param {Login_Footer_Learnmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_footer_learnmore1 = /** @type {((inputs?: Login_Footer_Learnmore1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_Learnmore1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_learnmore1(inputs)
	if (locale === "es") return es_login_footer_learnmore1(inputs)
	if (locale === "de") return de_login_footer_learnmore1(inputs)
	if (locale === "ar") return ar_login_footer_learnmore1(inputs)
	if (locale === "fr") return fr_login_footer_learnmore1(inputs)
	return ko_login_footer_learnmore1(inputs)
});
export { login_footer_learnmore1 as "login.footer.learnMore" }