/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Footer_Privacypolicy1Inputs */

const en_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de Privacidad`)
};

const de_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenschutzerklärung`)
};

const ar_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Sidemenu_Footer_Privacypolicy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_privacypolicy1 = /** @type {((inputs?: Sidemenu_Footer_Privacypolicy1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Footer_Privacypolicy1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_footer_privacypolicy1(inputs)
	if (locale === "es") return es_sidemenu_footer_privacypolicy1(inputs)
	if (locale === "de") return de_sidemenu_footer_privacypolicy1(inputs)
	return ar_sidemenu_footer_privacypolicy1(inputs)
});
export { sidemenu_footer_privacypolicy1 as "sidemenu.footer.privacyPolicy" }