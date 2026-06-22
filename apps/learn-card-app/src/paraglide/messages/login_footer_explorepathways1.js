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

const fr_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les parcours`)
};

const ar_login_footer_explorepathways1 = /** @type {(inputs: Login_Footer_Explorepathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف المسارات`)
};

/**
* | output |
* | --- |
* | "Explore Pathways" |
*
* @param {Login_Footer_Explorepathways1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_footer_explorepathways1 = /** @type {((inputs?: Login_Footer_Explorepathways1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Footer_Explorepathways1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_footer_explorepathways1(inputs)
	if (locale === "es") return es_login_footer_explorepathways1(inputs)
	if (locale === "fr") return fr_login_footer_explorepathways1(inputs)
	return ar_login_footer_explorepathways1(inputs)
});
export { login_footer_explorepathways1 as "login.footer.explorePathways" }