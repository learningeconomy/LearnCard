/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Footer_Privacypolicy1Inputs */

const en_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de privacidad`)
};

const de_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenschutzrichtlinie`)
};

const ar_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

const fr_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de confidentialité`)
};

const ko_sidemenu_footer_privacypolicy1 = /** @type {(inputs: Sidemenu_Footer_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인정보 처리방침`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Sidemenu_Footer_Privacypolicy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_privacypolicy1 = /** @type {((inputs?: Sidemenu_Footer_Privacypolicy1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Footer_Privacypolicy1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_footer_privacypolicy1(inputs)
	if (locale === "es") return es_sidemenu_footer_privacypolicy1(inputs)
	if (locale === "de") return de_sidemenu_footer_privacypolicy1(inputs)
	if (locale === "ar") return ar_sidemenu_footer_privacypolicy1(inputs)
	if (locale === "fr") return fr_sidemenu_footer_privacypolicy1(inputs)
	return ko_sidemenu_footer_privacypolicy1(inputs)
});
export { sidemenu_footer_privacypolicy1 as "sidemenu.footer.privacyPolicy" }