/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Namedesc2Inputs */

const en_networkprompts_settings_namedesc2 = /** @type {(inputs: Networkprompts_Settings_Namedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your name will appear in your connection’s contact list, but it is never be displayed publicly or shared otherwise without your express permission.`)
};

const es_networkprompts_settings_namedesc2 = /** @type {(inputs: Networkprompts_Settings_Namedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu nombre aparecerá en la lista de contactos, pero nunca se mostrará públicamente sin tu permiso.`)
};

const fr_networkprompts_settings_namedesc2 = /** @type {(inputs: Networkprompts_Settings_Namedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre nom apparaîtra dans la liste de contacts de vos connexions, mais ne sera jamais affiché publiquement ni partagé sans votre autorisation expresse.`)
};

const ar_networkprompts_settings_namedesc2 = /** @type {(inputs: Networkprompts_Settings_Namedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيظهر اسمك في قائمة جهات اتصال من تتواصل معهم، لكنه لا يعرض علناً أو يشارك بطريقة أخرى دون موافقتك.`)
};

/**
* | output |
* | --- |
* | "Your name will appear in your connection’s contact list, but it is never be displayed publicly or shared otherwise without your express permission." |
*
* @param {Networkprompts_Settings_Namedesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_namedesc2 = /** @type {((inputs?: Networkprompts_Settings_Namedesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Namedesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_namedesc2(inputs)
	if (locale === "es") return es_networkprompts_settings_namedesc2(inputs)
	if (locale === "fr") return fr_networkprompts_settings_namedesc2(inputs)
	return ar_networkprompts_settings_namedesc2(inputs)
});
export { networkprompts_settings_namedesc2 as "networkPrompts.settings.nameDesc" }