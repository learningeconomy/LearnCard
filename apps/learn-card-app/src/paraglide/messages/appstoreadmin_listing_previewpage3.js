/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Previewpage3Inputs */

const en_appstoreadmin_listing_previewpage3 = /** @type {(inputs: Appstoreadmin_Listing_Previewpage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Page`)
};

const es_appstoreadmin_listing_previewpage3 = /** @type {(inputs: Appstoreadmin_Listing_Previewpage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa de Página`)
};

const fr_appstoreadmin_listing_previewpage3 = /** @type {(inputs: Appstoreadmin_Listing_Previewpage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu de la Page`)
};

const ar_appstoreadmin_listing_previewpage3 = /** @type {(inputs: Appstoreadmin_Listing_Previewpage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة الصفحة`)
};

/**
* | output |
* | --- |
* | "Preview Page" |
*
* @param {Appstoreadmin_Listing_Previewpage3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_previewpage3 = /** @type {((inputs?: Appstoreadmin_Listing_Previewpage3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Previewpage3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_previewpage3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_previewpage3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_previewpage3(inputs)
	return ar_appstoreadmin_listing_previewpage3(inputs)
});
export { appstoreadmin_listing_previewpage3 as "appStoreAdmin.listing.previewPage" }