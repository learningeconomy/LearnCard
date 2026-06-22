/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs */

const en_developerportal_components_previewconfirmdialog_unsavedchanges4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have unsaved changes. Would you like to save your progress as a draft before previewing?`)
};

const es_developerportal_components_previewconfirmdialog_unsavedchanges4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have unsaved changes. Would you like to save your progress as a draft before previewing?`)
};

const fr_developerportal_components_previewconfirmdialog_unsavedchanges4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have unsaved changes. Would you like to save your progress as a draft before previewing?`)
};

const ar_developerportal_components_previewconfirmdialog_unsavedchanges4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have unsaved changes. Would you like to save your progress as a draft before previewing?`)
};

/**
* | output |
* | --- |
* | "You have unsaved changes. Would you like to save your progress as a draft before previewing?" |
*
* @param {Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_previewconfirmdialog_unsavedchanges4 = /** @type {((inputs?: Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Previewconfirmdialog_Unsavedchanges4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_previewconfirmdialog_unsavedchanges4(inputs)
	if (locale === "es") return es_developerportal_components_previewconfirmdialog_unsavedchanges4(inputs)
	if (locale === "fr") return fr_developerportal_components_previewconfirmdialog_unsavedchanges4(inputs)
	return ar_developerportal_components_previewconfirmdialog_unsavedchanges4(inputs)
});
export { developerportal_components_previewconfirmdialog_unsavedchanges4 as "developerPortal.components.previewConfirmDialog.unsavedChanges" }