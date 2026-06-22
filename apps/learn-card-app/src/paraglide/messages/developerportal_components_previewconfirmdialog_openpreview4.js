/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs */

const en_developerportal_components_previewconfirmdialog_openpreview4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Preview`)
};

const es_developerportal_components_previewconfirmdialog_openpreview4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir Vista Previa`)
};

const fr_developerportal_components_previewconfirmdialog_openpreview4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir l'Aperçu`)
};

const ar_developerportal_components_previewconfirmdialog_openpreview4 = /** @type {(inputs: Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح المعاينة`)
};

/**
* | output |
* | --- |
* | "Open Preview" |
*
* @param {Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_previewconfirmdialog_openpreview4 = /** @type {((inputs?: Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Previewconfirmdialog_Openpreview4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_previewconfirmdialog_openpreview4(inputs)
	if (locale === "es") return es_developerportal_components_previewconfirmdialog_openpreview4(inputs)
	if (locale === "fr") return fr_developerportal_components_previewconfirmdialog_openpreview4(inputs)
	return ar_developerportal_components_previewconfirmdialog_openpreview4(inputs)
});
export { developerportal_components_previewconfirmdialog_openpreview4 as "developerPortal.components.previewConfirmDialog.openPreview" }