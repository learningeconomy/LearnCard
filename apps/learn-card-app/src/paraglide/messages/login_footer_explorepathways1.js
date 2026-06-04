/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Footer_Explorepathways1Inputs */

const en_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore Pathways`)
};

const es_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar rutas`)
};

const de_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pfade erkunden`)
};

const ar_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف المسارات`)
};

const fr_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les parcours`)
};

const ko_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경로 탐색`)
};

/**
* | output |
* | --- |
* | "Explore Pathways" |
*
* @param {Login_Footer_Explorepathways1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_footer_explorepathways1 = /** @type {((inputs?: Login_Footer_Explorepathways1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_Explorepathways1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_explorepathways1(inputs)
	if (locale === "es") return es_login_footer_explorepathways1(inputs)
	if (locale === "de") return de_login_footer_explorepathways1(inputs)
	if (locale === "ar") return ar_login_footer_explorepathways1(inputs)
	if (locale === "fr") return fr_login_footer_explorepathways1(inputs)
	return ko_login_footer_explorepathways1(inputs)
});
export { login_footer_explorepathways1 as "login.footer.explorePathways" }