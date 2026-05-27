/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Footer_Termsofservice2Inputs */

const en_sidemenu_footer_termsofservice2 = /** @type {(inputs: Sidemenu_Footer_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_sidemenu_footer_termsofservice2 = /** @type {(inputs: Sidemenu_Footer_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos de Servicio`)
};

const de_sidemenu_footer_termsofservice2 = /** @type {(inputs: Sidemenu_Footer_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nutzungsbedingungen`)
};

const ar_sidemenu_footer_termsofservice2 = /** @type {(inputs: Sidemenu_Footer_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Sidemenu_Footer_Termsofservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_termsofservice2 = /** @type {((inputs?: Sidemenu_Footer_Termsofservice2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Footer_Termsofservice2Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_footer_termsofservice2(inputs)
	if (locale === "es") return es_sidemenu_footer_termsofservice2(inputs)
	if (locale === "de") return de_sidemenu_footer_termsofservice2(inputs)
	return ar_sidemenu_footer_termsofservice2(inputs)
});
export { sidemenu_footer_termsofservice2 as "sidemenu.footer.termsOfService" }