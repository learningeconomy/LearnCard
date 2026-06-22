/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs */

const en_developerportal_components_exitconfirmdialog_continueediting4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Editing`)
};

const es_developerportal_components_exitconfirmdialog_continueediting4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar Editando`)
};

const fr_developerportal_components_exitconfirmdialog_continueediting4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer l'Édition`)
};

const ar_developerportal_components_exitconfirmdialog_continueediting4 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مواصلة التحرير`)
};

/**
* | output |
* | --- |
* | "Continue Editing" |
*
* @param {Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_exitconfirmdialog_continueediting4 = /** @type {((inputs?: Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Exitconfirmdialog_Continueediting4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_exitconfirmdialog_continueediting4(inputs)
	if (locale === "es") return es_developerportal_components_exitconfirmdialog_continueediting4(inputs)
	if (locale === "fr") return fr_developerportal_components_exitconfirmdialog_continueediting4(inputs)
	return ar_developerportal_components_exitconfirmdialog_continueediting4(inputs)
});
export { developerportal_components_exitconfirmdialog_continueediting4 as "developerPortal.components.exitConfirmDialog.continueEditing" }