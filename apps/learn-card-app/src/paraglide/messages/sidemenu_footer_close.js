/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Footer_CloseInputs */

const en_sidemenu_footer_close = /** @type {(inputs: Sidemenu_Footer_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_sidemenu_footer_close = /** @type {(inputs: Sidemenu_Footer_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const de_sidemenu_footer_close = /** @type {(inputs: Sidemenu_Footer_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schließen`)
};

const ar_sidemenu_footer_close = /** @type {(inputs: Sidemenu_Footer_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

const fr_sidemenu_footer_close = /** @type {(inputs: Sidemenu_Footer_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ko_sidemenu_footer_close = /** @type {(inputs: Sidemenu_Footer_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`닫기`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Sidemenu_Footer_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_close = /** @type {((inputs?: Sidemenu_Footer_CloseInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Footer_CloseInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_footer_close(inputs)
	if (locale === "es") return es_sidemenu_footer_close(inputs)
	if (locale === "de") return de_sidemenu_footer_close(inputs)
	if (locale === "ar") return ar_sidemenu_footer_close(inputs)
	if (locale === "fr") return fr_sidemenu_footer_close(inputs)
	return ko_sidemenu_footer_close(inputs)
});
export { sidemenu_footer_close as "sidemenu.footer.close" }