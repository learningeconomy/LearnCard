/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs */

const en_developerportal_components_previewconfirmdialog_savedraftandpreview6 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Draft & Preview`)
};

const es_developerportal_components_previewconfirmdialog_savedraftandpreview6 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Draft & Preview`)
};

const fr_developerportal_components_previewconfirmdialog_savedraftandpreview6 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Draft & Preview`)
};

const ar_developerportal_components_previewconfirmdialog_savedraftandpreview6 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Draft & Preview`)
};

/**
* | output |
* | --- |
* | "Save Draft & Preview" |
*
* @param {Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_previewconfirmdialog_savedraftandpreview6 = /** @type {((inputs?: Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Previewconfirmdialog_Savedraftandpreview6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_previewconfirmdialog_savedraftandpreview6(inputs)
	if (locale === "es") return es_developerportal_components_previewconfirmdialog_savedraftandpreview6(inputs)
	if (locale === "fr") return fr_developerportal_components_previewconfirmdialog_savedraftandpreview6(inputs)
	return ar_developerportal_components_previewconfirmdialog_savedraftandpreview6(inputs)
});
export { developerportal_components_previewconfirmdialog_savedraftandpreview6 as "developerPortal.components.previewConfirmDialog.saveDraftAndPreview" }