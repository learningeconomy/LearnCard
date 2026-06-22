/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Previewmodal3Inputs */

const en_appstoreadmin_listing_previewmodal3 = /** @type {(inputs: Appstoreadmin_Listing_Previewmodal3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Modal`)
};

const es_appstoreadmin_listing_previewmodal3 = /** @type {(inputs: Appstoreadmin_Listing_Previewmodal3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa Modal`)
};

const fr_appstoreadmin_listing_previewmodal3 = /** @type {(inputs: Appstoreadmin_Listing_Previewmodal3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu Modal`)
};

const ar_appstoreadmin_listing_previewmodal3 = /** @type {(inputs: Appstoreadmin_Listing_Previewmodal3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة نافذة منبثقة`)
};

/**
* | output |
* | --- |
* | "Preview Modal" |
*
* @param {Appstoreadmin_Listing_Previewmodal3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_previewmodal3 = /** @type {((inputs?: Appstoreadmin_Listing_Previewmodal3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Previewmodal3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_previewmodal3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_previewmodal3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_previewmodal3(inputs)
	return ar_appstoreadmin_listing_previewmodal3(inputs)
});
export { appstoreadmin_listing_previewmodal3 as "appStoreAdmin.listing.previewModal" }