/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Editaccess2Inputs */

const en_networkprompts_settings_editaccess2 = /** @type {(inputs: Networkprompts_Settings_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Requested Access`)
};

const es_networkprompts_settings_editaccess2 = /** @type {(inputs: Networkprompts_Settings_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Acceso Solicitado`)
};

const fr_networkprompts_settings_editaccess2 = /** @type {(inputs: Networkprompts_Settings_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les accès demandés`)
};

const ar_networkprompts_settings_editaccess2 = /** @type {(inputs: Networkprompts_Settings_Editaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الوصول المطلوب`)
};

/**
* | output |
* | --- |
* | "Edit Requested Access" |
*
* @param {Networkprompts_Settings_Editaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_editaccess2 = /** @type {((inputs?: Networkprompts_Settings_Editaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Editaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_editaccess2(inputs)
	if (locale === "es") return es_networkprompts_settings_editaccess2(inputs)
	if (locale === "fr") return fr_networkprompts_settings_editaccess2(inputs)
	return ar_networkprompts_settings_editaccess2(inputs)
});
export { networkprompts_settings_editaccess2 as "networkPrompts.settings.editAccess" }