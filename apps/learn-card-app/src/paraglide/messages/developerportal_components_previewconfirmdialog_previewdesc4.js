/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs */

const en_developerportal_components_previewconfirmdialog_previewdesc4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app to test how it works within LearnCard. The diagnostics panel will show all partner-connect API calls.`)
};

const es_developerportal_components_previewconfirmdialog_previewdesc4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app to test how it works within LearnCard. The diagnostics panel will show all partner-connect API calls.`)
};

const fr_developerportal_components_previewconfirmdialog_previewdesc4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app to test how it works within LearnCard. The diagnostics panel will show all partner-connect API calls.`)
};

const ar_developerportal_components_previewconfirmdialog_previewdesc4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app to test how it works within LearnCard. The diagnostics panel will show all partner-connect API calls.`)
};

/**
* | output |
* | --- |
* | "Preview your app to test how it works within LearnCard. The diagnostics panel will show all partner-connect API calls." |
*
* @param {Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_previewconfirmdialog_previewdesc4 = /** @type {((inputs?: Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Previewconfirmdialog_Previewdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_previewconfirmdialog_previewdesc4(inputs)
	if (locale === "es") return es_developerportal_components_previewconfirmdialog_previewdesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_previewconfirmdialog_previewdesc4(inputs)
	return ar_developerportal_components_previewconfirmdialog_previewdesc4(inputs)
});
export { developerportal_components_previewconfirmdialog_previewdesc4 as "developerPortal.components.previewConfirmDialog.previewDesc" }