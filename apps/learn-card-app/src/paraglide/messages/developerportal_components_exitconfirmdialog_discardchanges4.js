/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs */

const en_developerportal_components_exitconfirmdialog_discardchanges4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Discard Changes`)
};

const es_developerportal_components_exitconfirmdialog_discardchanges4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descartar Cambios`)
};

const fr_developerportal_components_exitconfirmdialog_discardchanges4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler les Modifications`)
};

const ar_developerportal_components_exitconfirmdialog_discardchanges4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تجاهل التغييرات`)
};

/**
* | output |
* | --- |
* | "Discard Changes" |
*
* @param {Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_exitconfirmdialog_discardchanges4 = /** @type {((inputs?: Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Exitconfirmdialog_Discardchanges4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_exitconfirmdialog_discardchanges4(inputs)
	if (locale === "es") return es_developerportal_components_exitconfirmdialog_discardchanges4(inputs)
	if (locale === "fr") return fr_developerportal_components_exitconfirmdialog_discardchanges4(inputs)
	return ar_developerportal_components_exitconfirmdialog_discardchanges4(inputs)
});
export { developerportal_components_exitconfirmdialog_discardchanges4 as "developerPortal.components.exitConfirmDialog.discardChanges" }