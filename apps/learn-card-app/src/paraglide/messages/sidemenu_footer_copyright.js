/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ year: NonNullable<unknown> }} Sidemenu_Footer_CopyrightInputs */

const en_sidemenu_footer_copyright = /** @type {(inputs: Sidemenu_Footer_CopyrightInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`© ${i?.year} Learning Economy`)
};

const es_sidemenu_footer_copyright = /** @type {(inputs: Sidemenu_Footer_CopyrightInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`© ${i?.year} Learning Economy`)
};

const de_sidemenu_footer_copyright = /** @type {(inputs: Sidemenu_Footer_CopyrightInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`© ${i?.year} Learning Economy`)
};

const ar_sidemenu_footer_copyright = /** @type {(inputs: Sidemenu_Footer_CopyrightInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`© ${i?.year} Learning Economy`)
};

const fr_sidemenu_footer_copyright = /** @type {(inputs: Sidemenu_Footer_CopyrightInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`© ${i?.year} Learning Economy`)
};

const ko_sidemenu_footer_copyright = /** @type {(inputs: Sidemenu_Footer_CopyrightInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`© ${i?.year} Learning Economy`)
};

/**
* | output |
* | --- |
* | "© {year} Learning Economy" |
*
* @param {Sidemenu_Footer_CopyrightInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_footer_copyright = /** @type {((inputs: Sidemenu_Footer_CopyrightInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Footer_CopyrightInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_footer_copyright(inputs)
	if (locale === "es") return es_sidemenu_footer_copyright(inputs)
	if (locale === "de") return de_sidemenu_footer_copyright(inputs)
	if (locale === "ar") return ar_sidemenu_footer_copyright(inputs)
	if (locale === "fr") return fr_sidemenu_footer_copyright(inputs)
	return ko_sidemenu_footer_copyright(inputs)
});
export { sidemenu_footer_copyright as "sidemenu.footer.copyright" }