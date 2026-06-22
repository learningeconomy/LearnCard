/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs */

const en_developerportal_components_exitconfirmdialog_saveyourprogress5 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save your progress?`)
};

const es_developerportal_components_exitconfirmdialog_saveyourprogress5 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Guardar tu progreso?`)
};

const fr_developerportal_components_exitconfirmdialog_saveyourprogress5 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarder votre progression ?`)
};

const ar_developerportal_components_exitconfirmdialog_saveyourprogress5 = /** @type {(inputs: Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل تريد حفظ تقدمك؟`)
};

/**
* | output |
* | --- |
* | "Save your progress?" |
*
* @param {Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_exitconfirmdialog_saveyourprogress5 = /** @type {((inputs?: Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Exitconfirmdialog_Saveyourprogress5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_exitconfirmdialog_saveyourprogress5(inputs)
	if (locale === "es") return es_developerportal_components_exitconfirmdialog_saveyourprogress5(inputs)
	if (locale === "fr") return fr_developerportal_components_exitconfirmdialog_saveyourprogress5(inputs)
	return ar_developerportal_components_exitconfirmdialog_saveyourprogress5(inputs)
});
export { developerportal_components_exitconfirmdialog_saveyourprogress5 as "developerPortal.components.exitConfirmDialog.saveYourProgress" }