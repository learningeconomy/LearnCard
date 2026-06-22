/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs */

const en_developerportal_components_previewconfirmdialog_previewwithoutsaving5 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Without Saving`)
};

const es_developerportal_components_previewconfirmdialog_previewwithoutsaving5 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Without Saving`)
};

const fr_developerportal_components_previewconfirmdialog_previewwithoutsaving5 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Without Saving`)
};

const ar_developerportal_components_previewconfirmdialog_previewwithoutsaving5 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Without Saving`)
};

/**
* | output |
* | --- |
* | "Preview Without Saving" |
*
* @param {Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_previewconfirmdialog_previewwithoutsaving5 = /** @type {((inputs?: Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Previewconfirmdialog_Previewwithoutsaving5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_previewconfirmdialog_previewwithoutsaving5(inputs)
	if (locale === "es") return es_developerportal_components_previewconfirmdialog_previewwithoutsaving5(inputs)
	if (locale === "fr") return fr_developerportal_components_previewconfirmdialog_previewwithoutsaving5(inputs)
	return ar_developerportal_components_previewconfirmdialog_previewwithoutsaving5(inputs)
});
export { developerportal_components_previewconfirmdialog_previewwithoutsaving5 as "developerPortal.components.previewConfirmDialog.previewWithoutSaving" }