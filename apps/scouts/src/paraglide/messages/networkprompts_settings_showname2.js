/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Showname2Inputs */

const en_networkprompts_settings_showname2 = /** @type {(inputs: Networkprompts_Settings_Showname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Display name in your connections’ contact lists.`)
};

const es_networkprompts_settings_showname2 = /** @type {(inputs: Networkprompts_Settings_Showname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar nombre en las listas de contactos de tus conexiones.`)
};

const fr_networkprompts_settings_showname2 = /** @type {(inputs: Networkprompts_Settings_Showname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher le nom dans les listes de contacts de vos connexions.`)
};

const ar_networkprompts_settings_showname2 = /** @type {(inputs: Networkprompts_Settings_Showname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Display name in your connections’ contact lists.`)
};

/**
* | output |
* | --- |
* | "Display name in your connections’ contact lists." |
*
* @param {Networkprompts_Settings_Showname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_showname2 = /** @type {((inputs?: Networkprompts_Settings_Showname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Showname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_showname2(inputs)
	if (locale === "es") return es_networkprompts_settings_showname2(inputs)
	if (locale === "fr") return fr_networkprompts_settings_showname2(inputs)
	return ar_networkprompts_settings_showname2(inputs)
});
export { networkprompts_settings_showname2 as "networkPrompts.settings.showName" }